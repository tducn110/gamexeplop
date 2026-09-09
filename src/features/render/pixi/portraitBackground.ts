import { Assets, Container, Sprite, type Texture } from "pixi.js";

export const PORTRAIT_BACKGROUND_PHASES = [
  "start-courtyard",
  "sky-low",
  "sky-mid",
  "sky-high",
] as const;

export type PortraitBackgroundPhase = typeof PORTRAIT_BACKGROUND_PHASES[number];

export interface PortraitBackground {
  container: Container;
  phase: PortraitBackgroundPhase;
  sprite: Sprite;
  texture: Texture;
}

export async function createPortraitBackground(): Promise<PortraitBackground> {
  const texture = await Assets.load<Texture>("/assets/backgroundphone.webp");
  const container = new Container();
  const sprite = new Sprite(texture);
  container.addChild(sprite);
  return { container, phase: "start-courtyard", sprite, texture };
}

/**
 * One portrait scene is used at every viewport. The scene starts at the
 * courtyard and then advances through sky bands; after sky-high it loops only
 * through the sky bands, so the courtyard is never reintroduced by a desktop
 * or CSS background branch.
 */
export function syncPortraitBackground(
  background: PortraitBackground,
  width: number,
  height: number,
  scroll: number,
): void {
  // Scale with 30% sky headroom to allow smooth continuous downward parallax as tower ascends
  const scale = Math.max(width / background.texture.width, (height * 1.30) / background.texture.height);
  const sceneHeight = background.texture.height * scale;
  const maxScrollDown = sceneHeight - height;
  const baseY = height - sceneHeight;

  background.sprite.scale.set(scale);
  background.sprite.x = (width - background.sprite.width) / 2;

  // Smooth monotonic asymptotic parallax: transitions from ground courtyard into high sky
  // Eliminates sawtooth modulo resetting that caused periodic upward jumping / "đẩy lên"
  const progress = 1 - Math.exp(-Math.max(0, scroll) / 900);
  background.sprite.y = baseY + maxScrollDown * progress;

  if (progress < 0.25) {
    background.phase = "start-courtyard";
  } else if (progress < 0.55) {
    background.phase = "sky-low";
  } else if (progress < 0.85) {
    background.phase = "sky-mid";
  } else {
    background.phase = "sky-high";
  }
}

export function destroyPortraitBackground(background: PortraitBackground): void {
  background.container.destroy({ children: true });
}
