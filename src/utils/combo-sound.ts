import { audioManager, AUDIO_VOLUME } from "./audio-manager";

/**
 * Sound triggers for straw tower stacking gameplay.
 * Integrated with AudioManager Web Audio API graph:
 * - Dynamic pitch progression on stack land & match combos
 * - BGM ducking on important match combos and game over
 * - Pure Web Audio playback routing through sfxMuteGain, master compressor, and destination
 */

export function playDropSfx(): void {
  audioManager.playSfx("drop", { volume: AUDIO_VOLUME.drop, playbackRate: 1 });
}

export function playLandSfx(combo = 0): void {
  // Combo pitch progression: matches old pitch = 1.0 + min(combo, 8) * 0.08
  const speed = 1.0 + Math.min(combo, 8) * 0.08;
  audioManager.playSfx("land", { volume: AUDIO_VOLUME.land, playbackRate: speed });
}

export function playMatchSfx(combo: number): void {
  // Combo match cue: pitch progression and BGM ducking
  const speed = Math.min(1.22, 1 + Math.max(0, combo - 1) * 0.06);
  audioManager.duckBgm(0.25, 0.4);
  audioManager.playSfx("match", { volume: AUDIO_VOLUME.match, playbackRate: speed, maxVoices: 3 });
}

export function playLoseSfx(): void {
  audioManager.duckBgm(1.8, 0.2);
  audioManager.playSfx("lose", { volume: AUDIO_VOLUME.lose, playbackRate: 0.94 });
}
