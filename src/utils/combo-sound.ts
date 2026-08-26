import { sound } from "@pixi/sound";
import { audioManager } from "./audio-manager";

const SFX_URLS = {
  drop: "/assets/sfx-drop.mp3",
  land: "/assets/sfx-land.mp3",
  match: "/assets/sfx-match.mp3",
  lose: "/assets/bomb.mp3",
} as const;
const SFX = {
  drop: "game-drop",
  land: "game-land",
  match: "game-match",
  lose: "game-lose",
} as const;

function registerSound(alias: string, url: string) {
  if (!sound.exists(alias)) {
    sound.add(alias, { url, preload: true });
  }
}

registerSound(SFX.drop, SFX_URLS.drop);
registerSound(SFX.land, SFX_URLS.land);
registerSound(SFX.match, SFX_URLS.match);
registerSound(SFX.lose, SFX_URLS.lose);

function canPlaySfx() {
  return !audioManager.sfxMuted && !audioManager.hostMuted;
}

export function playDropSfx() {
  if (!canPlaySfx()) return;
  sound.play(SFX.drop, { volume: 0.32, speed: 1 });
}

export function playLandSfx() {
  if (!canPlaySfx()) return;
  sound.play(SFX.land, { volume: 0.42, speed: 1 });
}

export function playMatchSfx(combo: number) {
  if (!canPlaySfx()) return;
  // One shared xylophone cue; restart it so rapid matches do not queue stale notes.
  const speed = Math.min(1.22, 1 + Math.max(0, combo - 1) * 0.06);
  sound.stop(SFX.match);
  sound.play(SFX.match, { volume: 0.46, speed });
}

export function playLoseSfx() {
  if (!canPlaySfx()) return;
  sound.stop(SFX.lose);
  sound.play(SFX.lose, { volume: 0.68, speed: 0.94 });
}
