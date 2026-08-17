/**
 * Audio Manager — Web Audio API singleton.
 * Manages BGM (loop), SFX slice (polyphonic), SFX bomb.
 * All buffers are preloaded before game starts.
 */

type SfxName = "bgm" | "slice" | "bomb";
type AudioUnlockState = "locked" | "unlocking" | "ready" | "suspended" | "failed";

const LANDING_BGM_VOLUME = 0.10;
const GAME_BGM_VOLUME = 0.08;
const BUTTON_SFX_VOLUME = 0.58;

interface AudioBuffers {
  slice: AudioBuffer | null;
  bomb: AudioBuffer | null;
  bgm: AudioBuffer | null;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private buffers: AudioBuffers = { slice: null, bomb: null, bgm: null };
  
  private bgmSourceNode: AudioBufferSourceNode | null = null;
  private bgmLocalGain: GainNode | null = null;
  private unlockPromise: Promise<void> | null = null;

  private _musicMuted = false;
  private _sfxMuted = false;
  private _hostMuted = false;
  private _loaded = false;
  private _bgmPlaying = false;
  private unlockState: AudioUnlockState = "locked";
  private visibilityState: DocumentVisibilityState =
    typeof document === "undefined" ? "visible" : document.visibilityState;
  private desiredBgmVolume = LANDING_BGM_VOLUME;
  private musicShouldPlay = false;
  private currentBgmVolume = LANDING_BGM_VOLUME;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      
      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      
      this.applyMuteState();
    }
  }

  /** Unlock AudioContext (must be called from user gesture) */
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

        this.unlockState = this.ctx!.state === "running" ? "ready" : "suspended";
        if (this.musicShouldPlay && this.buffers.bgm && this.ctx!.state === "running") {
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

  /**
   * Preload all audio buffers. Returns progress 0-1 via onProgress.
   * `basePath` should point to the folder containing audio files, e.g. "/assets/".
   */
  async preloadAll(
    basePath: string,
    onProgress?: (ratio: number) => void
  ): Promise<void> {
    this.ensureContext();

    const files: { name: keyof AudioBuffers; url: string }[] = [
      { name: "slice", url: `${basePath}666herohero-slash-21834.mp3` },
      { name: "bomb", url: `${basePath}bomb.mp3` },
      { name: "bgm", url: `${basePath}BGMM_Lofi2.mp3` },
    ];

    let loaded = 0;
    const total = files.length;

    const loadOne = async (name: keyof AudioBuffers, url: string): Promise<void> => {
      if (this.buffers[name]) {
        loaded++;
        onProgress?.(loaded / total);
        return;
      }
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuf = await resp.arrayBuffer();
        const audioBuf = await this.ctx!.decodeAudioData(arrayBuf);
        this.buffers[name] = audioBuf;
      } catch (err) {
        console.warn(`[AudioManager] Failed to load ${name}:`, err);
      }
      loaded++;
      onProgress?.(loaded / total);
    };

    await Promise.all(files.map((f) => loadOne(f.name, f.url)));
    this._loaded = true;
    if (this.musicShouldPlay && this.ctx?.state === "running" && this.buffers.bgm) {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  /**
   * Preload only the BGM file (for landing page auto-play).
   * Returns true if loaded successfully.
   */
  async preloadBgmOnly(basePath: string): Promise<boolean> {
    this.ensureContext();
    if (this.buffers.bgm) return true;

    try {
      const resp = await fetch(`${basePath}BGMM_Lofi2.mp3`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await this.ctx!.decodeAudioData(arrayBuf);
      this.buffers.bgm = audioBuf;
      return true;
    } catch (err) {
      console.warn("[AudioManager] Failed to preload BGM", err);
      return false;
    }
  }

  /**
   * Request BGM playback. If audio is locked, the desired state is preserved
   * and playback starts when the first gesture unlocks the context.
   */
  requestBgm(volume = LANDING_BGM_VOLUME): void {
    this.desiredBgmVolume = this.clampVolume(volume);
    this.musicShouldPlay = true;

    if (this.ctx?.state === "running" && this.buffers.bgm) {
      this.startBgm(this.desiredBgmVolume);
    }
  }

  /** Play BGM in a loop at given volume (0-1). */
  playBgm(volume = 0.3): void {
    this.requestBgm(volume);
  }

  stopBgm(): void {
    this.musicShouldPlay = false;
    if (this.bgmSourceNode) {
      try { this.bgmSourceNode.stop(); } catch {}
      this.bgmSourceNode.disconnect();
      this.bgmSourceNode = null;
    }
    this._bgmPlaying = false;
  }

  /**
   * Play a one-shot SFX. Uses pool of up to `maxVoices` simultaneous sources.
   */
  private voicePools: Map<SfxName, AudioBufferSourceNode[]> = new Map();

  playSfx(name: SfxName, volume = 0.6, pitch = 1.0, maxVoices = 5): void {
    if (!this.ctx || !this.buffers[name]) return;
    
    const buf = this.buffers[name]!;
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = pitch;

    const gain = this.ctx.createGain();
    gain.gain.value = this.clampVolume(volume);

    // IMPORTANT: Connect to sfxGain, not ctx.destination directly
    source.connect(gain).connect(this.sfxGain!);

    let pool = this.voicePools.get(name);
    if (!pool) {
      pool = [];
      this.voicePools.set(name, pool);
    }
    const alive = [...pool];
    if (alive.length >= maxVoices) {
      try { alive[0].stop(); } catch {}
      alive.shift();
    }
    alive.push(source);
    this.voicePools.set(name, alive);

    source.onended = () => {
      const currentPool = this.voicePools.get(name);
      if (currentPool) this.voicePools.set(name, currentPool.filter((item) => item !== source));
      source.disconnect();
      gain.disconnect();
    };

    source.start(0);
  }

  playButtonSfx(volume = BUTTON_SFX_VOLUME): void {
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
    
    // IMPORTANT: Connect to sfxGain, not ctx.destination directly
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

  /** Toggle mute on/off */
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

  /** Mute imposed by the host/platform; does not change user preferences. */
  setHostMuted(m: boolean): void {
    this._hostMuted = m;
    this.applyMuteState();
  }

  private applyMuteState(): void {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this._musicMuted || this._hostMuted ? 0 : 1;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this._sfxMuted || this._hostMuted ? 0 : 1;
    }
  }

  /** Change BGM volume dynamically (0-1). Does not restart the track. */
  setBgmVolume(volume: number): void {
    this.currentBgmVolume = this.clampVolume(volume);
    this.desiredBgmVolume = this.currentBgmVolume;
    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }
  }

  setVisibilityState(state: DocumentVisibilityState): void {
    this.visibilityState = state;
  }

  /** Destroy all audio resources */
  destroy(): void {
    this.stopBgm();
    this.voicePools.forEach((pool) =>
      pool.forEach((s) => {
        try { s.stop(); } catch {}
        s.disconnect();
      })
    );
    this.voicePools.clear();
    
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
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.buffers = { slice: null, bomb: null, bgm: null };
    this._loaded = false;
  }

  private clampVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume));
  }

  private startBgm(volume: number): void {
    if (!this.ctx || !this.buffers.bgm) return;
    this.currentBgmVolume = this.clampVolume(volume);

    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }

    if (this._bgmPlaying && this.bgmSourceNode) {
      return;
    }

    if (this.bgmSourceNode) {
      try {
        this.bgmSourceNode.stop();
      } catch {}
      this.bgmSourceNode.disconnect();
    }

    if (!this.bgmLocalGain) {
      this.bgmLocalGain = this.ctx.createGain();
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
      this.bgmLocalGain.connect(this.bgmGain!);
    }

    this.bgmSourceNode = this.ctx.createBufferSource();
    this.bgmSourceNode.buffer = this.buffers.bgm;
    this.bgmSourceNode.loop = true;
    this.bgmSourceNode.connect(this.bgmLocalGain);
    this.bgmSourceNode.start(0);
    this._bgmPlaying = true;
  }
}

/** Global singleton */
export const audioManager = new AudioManager();
