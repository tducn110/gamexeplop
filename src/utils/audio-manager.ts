/**
 * Audio Manager — Web Audio API singleton.
 * Architecture referenced from 01-fruit and 02-2048:
 * - Central Audio Policy Authority (musicEnabled, sfxEnabled, parentMuted, hostPaused, documentHidden, unlocked)
 * - Single Web Audio context with master DynamicsCompressor to prevent distortion
 * - MediaElementAudioSourceNode for BGM (saves RAM while retaining Web Audio mixing/ducking)
 * - Decoded AudioBufferSourceNode for ultra-low-latency polyphonic SFX with pitch modulation
 * - holdAndRamp gain automation with BGM ducking on matches and game over
 * - Dual-oscillator synthesized button click/pop feedback
 * - Reliable synchronous user gesture unlock (plays 1-sample buffer for iOS Safari WebKit)
 * - Global pointerdown & keydown capture listeners to retry pending BGM & trigger button taps
 */

export interface AudioPolicyState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  parentMuted: boolean;
  hostPaused: boolean;
  documentHidden: boolean;
  unlocked: boolean;
}

export type AudioUnlockState = "locked" | "unlocking" | "ready" | "suspended" | "failed";

export const AUDIO_VOLUME = {
  master: 1.0,
  landingBgm: 0.45,
  gameBgm: 0.35,
  button: 0.70,
  drop: 0.70,
  land: 0.85,
  match: 0.95,
  lose: 0.95,
  tap: 0.70,
} as const;

export type SfxName = "drop" | "land" | "match" | "lose" | "tap";

const SFX_URLS: Record<SfxName, string> = {
  drop: "sfx-drop.mp3",
  land: "sfx-land.mp3",
  match: "sfx-match.mp3",
  lose: "bomb.mp3",
  tap: "sfx-drop.mp3",
};

const BUTTON_SFX_SELECTOR = [
  "button",
  "[role='button']",
  "a[href]",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  ".start-ready",
].join(",");

/** Pure predicate: checks if BGM playback is allowed by host and visibility rules */
export function isBgmPlaybackEligible(
  musicEnabled: boolean,
  hostPaused: boolean,
  documentHidden: boolean,
): boolean {
  return musicEnabled && !hostPaused && !documentHidden;
}

/** Pure predicate: checks if music bus is active */
export function isMusicActive(state: AudioPolicyState): boolean {
  return (
    state.musicEnabled &&
    !state.parentMuted &&
    !state.hostPaused &&
    !state.documentHidden &&
    state.unlocked
  );
}

/** Pure predicate: checks if SFX bus is active */
export function isSfxActive(state: AudioPolicyState): boolean {
  return (
    state.sfxEnabled &&
    !state.parentMuted &&
    !state.hostPaused &&
    !state.documentHidden
  );
}

/** Hold current parameter value, then linearly ramp to target */
export function holdAndRamp(param: AudioParam, target: number, at: number, duration: number): void {
  const p = param as AudioParam & { cancelAndHoldAtTime?: (time: number) => AudioParam };
  if (typeof p.cancelAndHoldAtTime === "function") {
    p.cancelAndHoldAtTime(at);
  } else {
    param.cancelScheduledValues(at);
    param.setValueAtTime(param.value, at);
  }
  param.linearRampToValueAtTime(target, at + duration);
}

function resolveAssetUrl(basePath: string, file: string): string {
  if (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("/")) {
    return file;
  }
  const cleanBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return cleanBase + file;
}

export class AudioManager {
  private ctx: AudioContext | null = null;

  private masterGain: GainNode | null = null;
  private bgmMuteGain: GainNode | null = null;
  private sfxMuteGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private bgmElement: HTMLAudioElement | null = null;
  private bgmSourceNode: MediaElementAudioSourceNode | null = null;
  private bgmLocalGain: GainNode | null = null;
  private bgmPlayPromise: Promise<void> | null = null;
  private bgmPendingStart = false;

  private buffers: Partial<Record<SfxName, AudioBuffer>> = {};
  private sfxLoadPromise: Promise<void> | null = null;
  private voicePools: Map<SfxName, AudioBufferSourceNode[]> = new Map();

  private unlockState: AudioUnlockState = "locked";
  private unlockPromise: Promise<void> | null = null;
  private _loaded = false;
  private _bgmPlaying = false;
  private desiredBgmVolume: number = AUDIO_VOLUME.landingBgm;
  private currentBgmVolume: number = AUDIO_VOLUME.landingBgm;
  private basePath = "/assets/";

  private policyState: AudioPolicyState = {
    musicEnabled: true,
    sfxEnabled: true,
    parentMuted: false,
    hostPaused: false,
    documentHidden: typeof document !== "undefined" ? Boolean(document.hidden) : false,
    unlocked: false,
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.attachGlobalListeners();
    }
  }

  private attachGlobalListeners(): void {
    if (typeof document === "undefined") return;

    let bootstrapped = false;

    const handleGesture = () => {
      if (!bootstrapped) {
        bootstrapped = true;
        void this.unlockAudio().catch((err) => console.warn("[AudioManager] Gesture unlock error:", err));
      } else if (this.bgmPendingStart && isMusicActive(this.policyState)) {
        this.startBgm(this.desiredBgmVolume);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      handleGesture();
      if (this.shouldPlayButtonSfx(event.target)) {
        this.playButtonSfx();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      handleGesture();
      if (this.shouldPlayButtonSfx(event.target)) {
        this.playButtonSfx();
      }
    };

    const handleVisibilityChange = () => {
      this.policyState.documentHidden = Boolean(document.hidden);
      this.syncAudioPolicy();
    };

    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  private shouldPlayButtonSfx(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    const control = target.closest(BUTTON_SFX_SELECTOR);
    if (!(control instanceof HTMLElement)) return false;
    if (control.closest("[data-sfx='off']")) return false;
    if (control.getAttribute("aria-disabled") === "true") return false;
    if ("disabled" in control && Boolean((control as HTMLButtonElement).disabled)) return false;
    return true;
  }

  private ensureContext(): void {
    if (this.ctx) return;
    if (typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();

      // Master audio chain: buses -> masterGain -> compressor -> destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = AUDIO_VOLUME.master;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -1.5;
      this.compressor.knee.value = 3;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.002;
      this.compressor.release.value = 0.10;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      // Sub-buses
      this.bgmMuteGain = this.ctx.createGain();
      this.sfxMuteGain = this.ctx.createGain();

      this.bgmMuteGain.connect(this.masterGain);
      this.sfxMuteGain.connect(this.masterGain);

      this.bgmMuteGain.gain.value = isMusicActive(this.policyState) ? 1 : 0;
      this.sfxMuteGain.gain.value = isSfxActive(this.policyState) ? 1 : 0;
    } catch (err) {
      console.warn("[AudioManager] Failed to initialize AudioContext:", err);
    }
  }

  private setupBgm(): void {
    if (this.bgmElement) {
      if (this.bgmElement.preload !== "auto") {
        this.bgmElement.preload = "auto";
      }
      return;
    }
    if (typeof Audio === "undefined") return;

    const bgmUrl = resolveAssetUrl(this.basePath, "BGMM_Lofi2.mp3");
    this.bgmElement = new Audio(bgmUrl);
    this.bgmElement.loop = true;
    this.bgmElement.preload = "auto";
    this.bgmElement.setAttribute("playsinline", "true");

    if (this.ctx && this.bgmMuteGain) {
      try {
        this.bgmSourceNode = this.ctx.createMediaElementSource(this.bgmElement);
        this.bgmLocalGain = this.ctx.createGain();
        this.bgmLocalGain.gain.value = this.currentBgmVolume;
        this.bgmSourceNode.connect(this.bgmLocalGain);
        this.bgmLocalGain.connect(this.bgmMuteGain);
      } catch (err) {
        console.warn("[AudioManager] Failed to route BGM through Web Audio graph:", err);
      }
    }
  }

  /**
   * Unlock AudioContext from a synchronous user gesture.
   * Plays a 1-sample silent buffer for iOS Safari WebKit.
   */
  async unlockAudio(): Promise<void> {
    this.ensureContext();
    if (this.policyState.unlocked && this.ctx?.state === "running") {
      this.unlockState = "ready";
      if (isMusicActive(this.policyState)) {
        this.startBgm(this.desiredBgmVolume);
      }
      return;
    }

    if (this.unlockPromise) return this.unlockPromise;

    this.unlockState = "unlocking";
    this.unlockPromise = (async () => {
      try {
        if (this.ctx && this.ctx.state === "suspended") {
          await this.ctx.resume();
        }

        if (this.ctx) {
          // Play a silent 1-sample buffer to unlock Web Audio on iOS Safari
          const buffer = this.ctx.createBuffer(1, 1, 22050);
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.ctx.destination);
          source.onended = () => {
            try { source.disconnect(); } catch {}
          };
          source.start(0);
        }

        this.policyState.unlocked = true;
        this.unlockState = this.ctx?.state === "running" ? "ready" : "suspended";

        this.setupBgm();
        this.syncAudioPolicy();

        // Async preload of SFX buffers in background without blocking UI
        void this.preloadSfxBuffers(this.basePath);
      } catch (error) {
        this.unlockState = "failed";
        console.warn("[AudioManager] Unlock failed:", error);
        throw error;
      } finally {
        this.unlockPromise = null;
      }
    })();

    return this.unlockPromise;
  }

  /** Alias for unlockAudio() */
  async unlock(): Promise<void> {
    return this.unlockAudio();
  }

  /** Alias for unlockAudio() */
  async unlockFromGesture(): Promise<void> {
    return this.unlockAudio();
  }

  private startBgm(volume: number): void {
    if (!this.bgmElement) this.setupBgm();
    if (!this.bgmElement) return;

    if (!isBgmPlaybackEligible(this.policyState.musicEnabled, this.policyState.hostPaused, this.policyState.documentHidden)) {
      return;
    }

    this.currentBgmVolume = this.clampVolume(volume);
    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }

    if (this._bgmPlaying && !this.bgmElement.paused) return;
    if (this.bgmPlayPromise) return;

    try {
      const playRes = this.bgmElement.play();
      if (playRes && typeof playRes.then === "function") {
        this.bgmPlayPromise = playRes
          .then(() => {
            this._bgmPlaying = true;
            this.bgmPendingStart = false;
          })
          .catch((err) => {
            this._bgmPlaying = false;
            if (err?.name === "NotAllowedError") {
              this.bgmPendingStart = true;
            } else {
              console.warn("[AudioManager] BGM play deferred until interaction:", err);
            }
          })
          .finally(() => {
            this.bgmPlayPromise = null;
          });
      } else {
        this._bgmPlaying = true;
        this.bgmPendingStart = false;
      }
    } catch (err) {
      this._bgmPlaying = false;
      console.warn("[AudioManager] BGM play exception:", err);
    }
  }

  requestBgm(volume: number = AUDIO_VOLUME.landingBgm): void {
    this.desiredBgmVolume = this.clampVolume(volume);
    this.currentBgmVolume = this.desiredBgmVolume;

    if (this.bgmLocalGain && this.ctx) {
      holdAndRamp(this.bgmLocalGain.gain, this.currentBgmVolume, this.ctx.currentTime, 0.03);
    }

    if (this.ctx?.state === "running" && isMusicActive(this.policyState)) {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  playBgm(volume: number = AUDIO_VOLUME.landingBgm): void {
    this.requestBgm(volume);
  }

  pauseBgm(): void {
    if (this.bgmElement && !this.bgmElement.paused) {
      this.bgmElement.pause();
    }
    this._bgmPlaying = false;
  }

  resumeBgm(): void {
    if (isMusicActive(this.policyState)) {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  stopBgm(): void {
    this.bgmPendingStart = false;
    this.pauseBgm();
  }

  setBgmVolume(volume: number): void {
    this.requestBgm(volume);
  }

  /**
   * Duck BGM volume smoothly during impactful SFX (e.g. combo match, game over)
   * Referencing 02_2048 duckBgm pattern.
   */
  duckBgm(duration = 0.25, duckRatio = 0.4): void {
    if (!this.ctx || !this.bgmLocalGain) return;
    const now = this.ctx.currentTime;
    holdAndRamp(this.bgmLocalGain.gain, this.currentBgmVolume * duckRatio, now, 0.04);
    holdAndRamp(this.bgmLocalGain.gain, this.currentBgmVolume, now + duration, 0.35);
  }

  /**
   * Play buffer-based SFX with polyphonic voice pool and pitch modulation.
   */
  playSfx(
    name: SfxName,
    options: { volume?: number; playbackRate?: number; maxVoices?: number } = {},
  ): void {
    if (!isSfxActive(this.policyState)) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxMuteGain) return;

    const buf = this.buffers[name];
    if (!buf) {
      // Fallback to oscillator click if tap sound requested before buffer loads
      if (name === "tap" || name === "drop") {
        this.playButtonSfx(options.volume ?? AUDIO_VOLUME.button);
      }
      return;
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const defaultVol: number = AUDIO_VOLUME[name] ?? 0.5;
    const { volume = defaultVol, playbackRate = 1.0, maxVoices = 6 } = options;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = playbackRate;

    const localGain = this.ctx.createGain();
    localGain.gain.value = this.clampVolume(volume);

    source.connect(localGain);
    localGain.connect(this.sfxMuteGain);

    let pool = this.voicePools.get(name);
    if (!pool) {
      pool = [];
      this.voicePools.set(name, pool);
    }
    if (pool.length >= maxVoices) {
      try { pool[0].stop(); } catch {}
      pool.shift();
    }
    pool.push(source);

    source.onended = () => {
      const currentPool = this.voicePools.get(name);
      if (currentPool) {
        this.voicePools.set(name, currentPool.filter((s) => s !== source));
      }
      try {
        source.disconnect();
        localGain.disconnect();
      } catch {}
    };

    source.start(0);
  }

  /**
   * Dual-oscillator synthesized button tap feedback (click + pop).
   * Referencing 01-fruit playButtonSfx pattern.
   */
  playButtonSfx(volume: number = AUDIO_VOLUME.button): void {
    if (!isSfxActive(this.policyState)) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxMuteGain) return;

    const wasSuspended = this.ctx.state === "suspended";
    if (wasSuspended) {
      void this.ctx.resume().catch(() => {});
    }

    // ponytail: iOS Safari freezes ctx.currentTime while suspended.
    // Offset by 0.05s so ctx.resume() resolves before oscillators start.
    const startOffset = wasSuspended ? 0.05 : 0;
    const now = this.ctx.currentTime + startOffset;
    const gain = this.ctx.createGain();
    const click = this.ctx.createOscillator();
    const pop = this.ctx.createOscillator();
    const finalVolume = this.clampVolume(volume);

    click.type = "triangle";
    click.frequency.setValueAtTime(920, now);
    click.frequency.exponentialRampToValueAtTime(520, now + 0.055);

    pop.type = "sine";
    pop.frequency.setValueAtTime(210, now);
    pop.frequency.exponentialRampToValueAtTime(130, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(finalVolume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    click.connect(gain);
    pop.connect(gain);
    gain.connect(this.sfxMuteGain);

    click.start(now);
    pop.start(now);
    click.stop(now + 0.09);
    pop.stop(now + 0.09);

    const cleanup = () => {
      try {
        click.disconnect();
        pop.disconnect();
        gain.disconnect();
      } catch {}
    };
    click.onended = cleanup;
  }

  /** Sync audio policy across buses and background playback */
  private syncAudioPolicy(): void {
    const now = this.ctx?.currentTime ?? 0;
    const musicActive = isMusicActive(this.policyState);
    const sfxActive = isSfxActive(this.policyState);

    if (this.bgmMuteGain) {
      holdAndRamp(this.bgmMuteGain.gain, musicActive ? 1 : 0, now, 0.03);
    }
    if (this.sfxMuteGain) {
      holdAndRamp(this.sfxMuteGain.gain, sfxActive ? 1 : 0, now, 0.03);
    }

    if (!musicActive) {
      this.bgmPendingStart = false;
      if (this.bgmElement && !this.bgmElement.paused) {
        this.bgmElement.pause();
        this._bgmPlaying = false;
      }
    } else if (this.policyState.unlocked && isBgmPlaybackEligible(this.policyState.musicEnabled, this.policyState.hostPaused, this.policyState.documentHidden)) {
      this.setupBgm();
      this.startBgm(this.desiredBgmVolume);
    }

    if (!this.policyState.documentHidden && !this.policyState.hostPaused && this.policyState.unlocked && this.ctx?.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMusicMuted(muted: boolean): void {
    this.policyState.musicEnabled = !muted;
    this.syncAudioPolicy();
  }

  setSfxMuted(muted: boolean): void {
    this.policyState.sfxEnabled = !muted;
    this.syncAudioPolicy();
  }

  setHostMuted(muted: boolean): void {
    this.policyState.parentMuted = muted;
    this.syncAudioPolicy();
  }

  setParentMuted(muted: boolean): void {
    this.setHostMuted(muted);
  }

  setHostPaused(paused: boolean): void {
    this.policyState.hostPaused = paused;
    this.syncAudioPolicy();
  }

  setMuted(m: boolean): void {
    this.setMusicMuted(m);
    this.setSfxMuted(m);
  }

  setVisibilityState(state: DocumentVisibilityState): void {
    this.policyState.documentHidden = state === "hidden";
    this.syncAudioPolicy();
  }

  async preloadSfxBuffers(basePath = "/assets/"): Promise<void> {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.sfxLoadPromise) return this.sfxLoadPromise;

    const entries = Object.entries(SFX_URLS) as [SfxName, string][];
    this.sfxLoadPromise = Promise.all(
      entries.map(async ([name, url]) => {
        if (this.buffers[name]) return;
        try {
          const finalUrl = resolveAssetUrl(basePath, url);
          const resp = await fetch(finalUrl);
          if (!resp.ok) return;
          const arrayBuffer = await resp.arrayBuffer();
          const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
          this.buffers[name] = decoded;
        } catch {
          // Ignore loading errors in headless/test environments
        }
      })
    ).then(() => {});

    return this.sfxLoadPromise;
  }

  async preloadAll(basePath = "/assets/", onProgress?: (ratio: number) => void): Promise<void> {
    this.basePath = basePath;
    this.setupBgm();
    await this.preloadSfxBuffers(basePath);
    this._loaded = true;
    onProgress?.(1);

    if (this.ctx?.state === "running" && isMusicActive(this.policyState)) {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  async preloadBgmOnly(basePath = "/assets/"): Promise<boolean> {
    this.basePath = basePath;
    this.setupBgm();
    return true;
  }

  get muted() { return !this.policyState.musicEnabled && !this.policyState.sfxEnabled; }
  get musicMuted() { return !this.policyState.musicEnabled; }
  get sfxMuted() { return !this.policyState.sfxEnabled; }
  get hostMuted() { return this.policyState.parentMuted; }
  get parentMuted() { return this.policyState.parentMuted; }
  get loaded() { return this._loaded; }
  get bgmPlaying() { return this._bgmPlaying; }
  get visibilityStateSnapshot() { return this.policyState.documentHidden ? "hidden" : "visible"; }
  get landingBgmVolume(): number { return AUDIO_VOLUME.landingBgm; }
  get gameBgmVolume(): number { return AUDIO_VOLUME.gameBgm; }
  getUnlockState() { return this.unlockState; }

  getDiagnostics() {
    return {
      unlockState: this.unlockState,
      bgmPlaying: this._bgmPlaying,
      musicShouldPlay: isMusicActive(this.policyState),
      visibilityState: (this.policyState.documentHidden ? "hidden" : "visible") as DocumentVisibilityState,
      ctxState: this.ctx?.state ?? "none",
    };
  }

  destroy(): void {
    this.stopBgm();
    this.voicePools.forEach((pool) => {
      pool.forEach((s) => {
        try { s.stop(); } catch {}
        try { s.disconnect(); } catch {}
      });
    });
    this.voicePools.clear();

    if (this.bgmLocalGain) {
      try { this.bgmLocalGain.disconnect(); } catch {}
      this.bgmLocalGain = null;
    }
    if (this.bgmSourceNode) {
      try { this.bgmSourceNode.disconnect(); } catch {}
      this.bgmSourceNode = null;
    }
    if (this.bgmElement) {
      this.bgmElement.pause();
      this.bgmElement = null;
    }
    if (this.bgmMuteGain) {
      try { this.bgmMuteGain.disconnect(); } catch {}
      this.bgmMuteGain = null;
    }
    if (this.sfxMuteGain) {
      try { this.sfxMuteGain.disconnect(); } catch {}
      this.sfxMuteGain = null;
    }
    if (this.compressor) {
      try { this.compressor.disconnect(); } catch {}
      this.compressor = null;
    }
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch {}
      this.masterGain = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this._loaded = false;
    this.buffers = {};
    this.sfxLoadPromise = null;
  }

  private clampVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume));
  }
}

export const audioManager = new AudioManager();
