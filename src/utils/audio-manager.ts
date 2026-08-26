/**
 * Audio Manager — Web Audio API singleton.
 * Adapted from 2048 audio architecture:
 * - HTMLAudioElement for BGM (saves memory)
 * - Master DynamicsCompressor to prevent clipping
 * - Smooth gain ramping (ducking, muting)
 * - Global button SFX listener
 */

type AudioUnlockState = "locked" | "unlocking" | "ready" | "suspended" | "failed";

const LANDING_BGM_VOLUME = 0.10;
const GAME_BGM_VOLUME = 0.08;
const BUTTON_SFX_VOLUME = 0.58;

const BUTTON_SFX_SELECTOR = [
  "button",
  "[role='button']",
  "a[href]",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
].join(",");

function holdAndRamp(param: AudioParam, target: number, at: number, duration: number) {
  const p = param as AudioParam & { cancelAndHoldAtTime?: (time: number) => AudioParam };
  if (typeof p.cancelAndHoldAtTime === "function") {
    p.cancelAndHoldAtTime(at);
  } else {
    param.cancelScheduledValues(at);
    param.setValueAtTime(param.value, at);
  }
  param.linearRampToValueAtTime(target, at + duration);
}

export class AudioManager {
  private ctx: AudioContext | null = null;

  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private bgmElement: HTMLAudioElement | null = null;
  private bgmSourceNode: MediaElementAudioSourceNode | null = null;
  private bgmLocalGain: GainNode | null = null;
  private unlockPromise: Promise<void> | null = null;
  private bgmPlayPromise: Promise<void> | null = null;

  private _musicMuted = false;
  private _sfxMuted = false;
  private _hostMuted = false;
  private _loaded = false;
  private _bgmPlaying = false;
  private bgmPendingStart = false;
  private unlockState: AudioUnlockState = "locked";
  private visibilityState: DocumentVisibilityState =
    typeof document === "undefined" ? "visible" : document.visibilityState;
  private desiredBgmVolume = LANDING_BGM_VOLUME;
  private musicShouldPlay = false;
  private currentBgmVolume = LANDING_BGM_VOLUME;

  constructor() {
    if (typeof window !== "undefined") {
      this.attachGlobalListeners();
    }
  }

  private attachGlobalListeners() {
    let bootstrapped = false;

    const handleInteraction = () => {
      if (!bootstrapped) {
        bootstrapped = true;
        this.unlockFromGesture().catch((error) => console.warn("Audio unlock failed", error));
      }
      if (this.bgmPendingStart && this.musicShouldPlay && this.unlockState === "ready") {
        this.startBgm(this.desiredBgmVolume);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      handleInteraction();
      if (this.shouldPlayButtonSfx(event.target)) {
        this.playButtonSfx();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      handleInteraction();
      if (this.shouldPlayButtonSfx(event.target)) {
        this.playButtonSfx();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
  }

  private shouldPlayButtonSfx(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    const control = target.closest(BUTTON_SFX_SELECTOR);
    if (!(control instanceof HTMLElement)) return false;
    if (control.closest("[data-sfx='off']")) return false;
    if (control.getAttribute("aria-disabled") === "true") return false;
    if ("disabled" in control && Boolean((control as any).disabled)) return false;
    return true;
  }

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -6;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.15;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.applyMuteState(true);
    }
  }

  async unlock(): Promise<void> {
    return this.unlockFromGesture();
  }

  async unlockFromGesture(): Promise<void> {
    this.ensureContext();
    if (this.unlockState === "unlocking") {
      return this.unlockPromise ?? Promise.resolve();
    }

    this.unlockState = "unlocking";
    this.unlockPromise = (async () => {
      try {
        if (this.ctx!.state === "suspended") {
          await this.ctx!.resume();
        }

        // Play silent buffer for iOS
        const buffer = this.ctx!.createBuffer(1, 1, 22050);
        const source = this.ctx!.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx!.destination);
        source.start(0);

        this.unlockState = this.ctx!.state === "running" ? "ready" : "suspended";
        if (this.musicShouldPlay && this.ctx!.state === "running") {
          this.startBgm(this.desiredBgmVolume);
        }
      } catch (error) {
        this.unlockState = "failed";
        throw error;
      } finally {
        this.unlockPromise = null;
      }
    })();

    return this.unlockPromise;
  }

  get muted() { return this._musicMuted && this._sfxMuted; }
  get musicMuted() { return this._musicMuted; }
  get sfxMuted() { return this._sfxMuted; }
  get hostMuted() { return this._hostMuted; }
  get loaded() { return this._loaded; }
  get bgmPlaying() { return this._bgmPlaying; }
  get visibilityStateSnapshot() { return this.visibilityState; }
  getUnlockState() { return this.unlockState; }
  get landingBgmVolume() { return LANDING_BGM_VOLUME; }
  get gameBgmVolume() { return GAME_BGM_VOLUME; }
  getDiagnostics() {
    return {
      unlockState: this.unlockState,
      bgmPlaying: this._bgmPlaying,
      musicShouldPlay: this.musicShouldPlay,
      visibilityState: this.visibilityState,
      ctxState: this.ctx?.state ?? "none",
    };
  }

  async preloadAll(
    basePath: string,
    onProgress?: (ratio: number) => void
  ): Promise<void> {
    this.ensureContext();

    // BGM uses HTMLAudioElement instead of loading into buffer
    const bgmUrl = `${basePath}BGMM_Lofi2.mp3`;

    let loaded = 0;
    const total = 1;

    if (!this.bgmElement) {
      this.bgmElement = new Audio(bgmUrl);
      this.bgmElement.loop = true;
      this.bgmElement.preload = "auto";
      this.bgmElement.setAttribute("playsinline", "true");

      this.bgmLocalGain = this.ctx!.createGain();
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
      this.bgmSourceNode = this.ctx!.createMediaElementSource(this.bgmElement);
      this.bgmSourceNode.connect(this.bgmLocalGain);
      this.bgmLocalGain.connect(this.bgmGain!);
    }

    loaded++;
    onProgress?.(loaded / total);

    this._loaded = true;

    if (this.musicShouldPlay && this.ctx?.state === "running") {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  async preloadBgmOnly(basePath: string): Promise<boolean> {
    this.ensureContext();
    if (this.bgmElement) return true;

    const bgmUrl = `${basePath}BGMM_Lofi2.mp3`;
    this.bgmElement = new Audio(bgmUrl);
    this.bgmElement.loop = true;
    this.bgmElement.preload = "auto";
    this.bgmElement.setAttribute("playsinline", "true");

    this.bgmLocalGain = this.ctx!.createGain();
    this.bgmLocalGain.gain.value = this.currentBgmVolume;
    this.bgmSourceNode = this.ctx!.createMediaElementSource(this.bgmElement);
    this.bgmSourceNode.connect(this.bgmLocalGain);
    this.bgmLocalGain.connect(this.bgmGain!);

    return true;
  }

  requestBgm(volume = LANDING_BGM_VOLUME): void {
    this.desiredBgmVolume = this.clampVolume(volume);
    this.musicShouldPlay = true;

    if (this.ctx?.state === "running") {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  playBgm(volume = 0.3): void {
    this.requestBgm(volume);
  }

  stopBgm(): void {
    this.musicShouldPlay = false;
    this.bgmPendingStart = false;
    if (this.bgmElement) {
      this.bgmElement.pause();
    }
    this._bgmPlaying = false;
  }

  playButtonSfx(volume = BUTTON_SFX_VOLUME): void {
    if (this._sfxMuted || this._hostMuted) return;
    this.ensureContext();
    if (this.ctx!.state === "suspended") {
      void this.ctx!.resume().catch(() => {});
    }

    const now = this.ctx!.currentTime;
    const gain = this.ctx!.createGain();
    const click = this.ctx!.createOscillator();
    const pop = this.ctx!.createOscillator();
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
    gain.connect(this.sfxGain!);

    click.start(now);
    pop.start(now);
    click.stop(now + 0.09);
    pop.stop(now + 0.09);

    const cleanup = () => {
      click.disconnect();
      pop.disconnect();
      gain.disconnect();
    };
    click.onended = cleanup;
  }

  setMuted(m: boolean): void {
    this._musicMuted = m;
    this._sfxMuted = m;
    this.applyMuteState();
  }

  setMusicMuted(m: boolean): void {
    this._musicMuted = m;
    this.applyMuteState();
    if (!m && this.musicShouldPlay && !this._bgmPlaying && this.ctx?.state === "running") {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  setSfxMuted(m: boolean): void {
    this._sfxMuted = m;
    this.applyMuteState();
  }

  setHostMuted(m: boolean): void {
    this._hostMuted = m;
    this.applyMuteState();
  }

  private applyMuteState(immediate = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = immediate ? 0 : 0.03;

    if (this.bgmGain) {
      const target = this._musicMuted || this._hostMuted ? 0 : 1;
      holdAndRamp(this.bgmGain.gain, target, now, duration);
    }
    if (this.sfxGain) {
      const target = this._sfxMuted || this._hostMuted ? 0 : 1;
      holdAndRamp(this.sfxGain.gain, target, now, duration);
    }
  }

  setBgmVolume(volume: number): void {
    this.currentBgmVolume = this.clampVolume(volume);
    this.desiredBgmVolume = this.currentBgmVolume;
    if (this.bgmLocalGain && this.ctx) {
      holdAndRamp(this.bgmLocalGain.gain, this.currentBgmVolume, this.ctx.currentTime, 0.03);
    }
  }

  setVisibilityState(state: DocumentVisibilityState): void {
    this.visibilityState = state;
  }

  destroy(): void {
    this.stopBgm();
    if (this.bgmLocalGain) {
      this.bgmLocalGain.disconnect();
      this.bgmLocalGain = null;
    }
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
    if (this.sfxGain) {
      this.sfxGain.disconnect();
      this.sfxGain = null;
    }
    if (this.compressor) {
      this.compressor.disconnect();
      this.compressor = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this._loaded = false;
  }

  private clampVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume));
  }

  private startBgm(volume: number): void {
    if (!this.ctx || !this.bgmElement) return;
    this.currentBgmVolume = this.clampVolume(volume);

    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }

    if (this._bgmPlaying && !this.bgmElement.paused) return;
    if (this.bgmPlayPromise) return;

    this.bgmPlayPromise = this.bgmElement.play()
      .then(() => {
        this._bgmPlaying = true;
        this.bgmPendingStart = false;
      })
      .catch((err) => {
        this._bgmPlaying = false;
        if (err?.name === "NotAllowedError") {
          this.bgmPendingStart = true;
        } else {
          console.warn("BGM play failed:", err);
        }
      })
      .finally(() => {
        this.bgmPlayPromise = null;
      });
  }
}

export const audioManager = new AudioManager();
