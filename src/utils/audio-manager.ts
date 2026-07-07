/**
 * Audio Manager — Web Audio API singleton.
 * Manages BGM (loop), SFX slice (polyphonic), SFX bomb.
 * All buffers are preloaded before game starts.
 */

type SfxName = "bgm" | "slice" | "bomb";

const LANDING_BGM_VOLUME = 0.24;
const GAME_BGM_VOLUME = 0.16;
const BUTTON_SFX_VOLUME = 0.58;

interface AudioBuffers {
  slice: AudioBuffer | null;
  bomb: AudioBuffer | null;
  bgm: AudioBuffer | null;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private buffers: AudioBuffers = { slice: null, bomb: null, bgm: null };
  
  private bgmSourceNode: AudioBufferSourceNode | null = null;
  private bgmLocalGain: GainNode | null = null;

  private _musicMuted = false;
  private _sfxMuted = false;
  private _loaded = false;
  private _bgmPlaying = false;
  private currentBgmVolume = LANDING_BGM_VOLUME;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      
      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      
      this.bgmGain.gain.value = this._musicMuted ? 0 : 1;
      this.sfxGain.gain.value = this._sfxMuted ? 0 : 1;
    }
  }

  /** Unlock AudioContext (must be called from user gesture) */
  async unlock(): Promise<void> {
    this.ensureContext();
    if (this.ctx!.state === "suspended") {
      await this.ctx!.resume();
    }
  }

  get muted() { return this._musicMuted && this._sfxMuted; }
  get musicMuted() { return this._musicMuted; }
  get sfxMuted() { return this._sfxMuted; }
  get loaded() { return this._loaded; }
  get bgmPlaying() { return this._bgmPlaying; }
  get landingBgmVolume() { return LANDING_BGM_VOLUME; }
  get gameBgmVolume() { return GAME_BGM_VOLUME; }

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
      { name: "bgm", url: `${basePath}moavii-we-are.mp3` },
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
  }

  /**
   * Preload only the BGM file (for landing page auto-play).
   * Returns true if loaded successfully.
   */
  async preloadBgmOnly(basePath: string): Promise<boolean> {
    this.ensureContext();
    if (this.buffers.bgm) return true;

    try {
      const resp = await fetch(`${basePath}moavii-we-are.mp3`);
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
   * Try to auto-play BGM on page load. If browser blocks AudioContext
   * (autoplay policy), waits for first user interaction then plays.
   * Call this when landing page mounts — no extra click needed.
   */
  tryAutoPlayBgm(basePath: string): void {
    const doPlay = async () => {
      if (this._bgmPlaying) return;
      this.ensureContext();

      if (this.ctx!.state === "suspended") {
        try { await this.ctx!.resume(); } catch {}
      }

      if (!this.buffers.bgm) {
        const ok = await this.preloadBgmOnly(basePath);
        if (!ok) return;
      }

      if (this.ctx!.state === "running") {
        this.playBgm(LANDING_BGM_VOLUME);
      }
    };

    doPlay();

    const resumeOnInteraction = async () => {
      if (this._bgmPlaying) { cleanup(); return; }
      this.ensureContext();
      if (this.ctx!.state === "suspended") {
        try { await this.ctx!.resume(); } catch {}
      }
      if (!this.buffers.bgm) {
        await this.preloadBgmOnly(basePath);
      }
      if (this.ctx!.state === "running" && !this._bgmPlaying) {
        this.playBgm(LANDING_BGM_VOLUME);
      }
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("touchstart", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };

    document.addEventListener("click", resumeOnInteraction, { once: true });
    document.addEventListener("touchstart", resumeOnInteraction, { once: true });
    document.addEventListener("keydown", resumeOnInteraction, { once: true });
  }

  /** Play BGM in a loop at given volume (0-1). */
  playBgm(volume = 0.3): void {
    if (!this.ctx || !this.buffers.bgm) return;
    this.currentBgmVolume = this.clampVolume(volume);
    
    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }
    
    if (this._bgmPlaying && this.bgmSourceNode) {
      return; // Already playing
    }
    
    if (this.bgmSourceNode) {
      try { this.bgmSourceNode.stop(); } catch {}
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

  stopBgm(): void {
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
  }

  setSfxMuted(m: boolean): void {
    this._sfxMuted = m;
    this.applyMuteState();
  }

  private applyMuteState(): void {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this._musicMuted ? 0 : 1;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this._sfxMuted ? 0 : 1;
    }
  }

  /** Change BGM volume dynamically (0-1). Does not restart the track. */
  setBgmVolume(volume: number): void {
    this.currentBgmVolume = this.clampVolume(volume);
    if (this.bgmLocalGain) {
      this.bgmLocalGain.gain.value = this.currentBgmVolume;
    }
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
}

/** Global singleton */
export const audioManager = new AudioManager();
