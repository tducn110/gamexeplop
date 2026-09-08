import { audioManager } from "./audio-manager";

/**
 * Sound triggers for straw tower stacking gameplay.
 * Integrated with AudioManager Web Audio API graph:
 * - Dynamic pitch progression on stack land & match combos
 * - BGM ducking on important match combos and game over
 * - Pure Web Audio playback routing through sfxMuteGain, master compressor, and destination
 */

export function playDropSfx(): void {
  audioManager.playSfx("drop", { volume: 0.35, playbackRate: 1 });
}

export function playLandSfx(combo = 0): void {
  // Combo pitch progression: matches old pitch = 1.0 + min(combo, 8) * 0.08
  const speed = 1.0 + Math.min(combo, 8) * 0.08;
  audioManager.playSfx("land", { volume: 0.45, playbackRate: speed });
}

export function playMatchSfx(combo: number): void {
  // Combo match cue: pitch progression and BGM ducking
  const speed = Math.min(1.22, 1 + Math.max(0, combo - 1) * 0.06);
  audioManager.duckBgm(0.25, 0.4);
  audioManager.playSfx("match", { volume: 0.52, playbackRate: speed, maxVoices: 3 });
}

export function playLoseSfx(): void {
  audioManager.duckBgm(1.8, 0.2);
  audioManager.playSfx("lose", { volume: 0.68, playbackRate: 0.94 });
}
