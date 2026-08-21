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
  const scale = Math.max(width / background.texture.width, height / background.texture.height);
  const sceneHeight = background.texture.height * scale;
  const courtyardDistance = Math.max(1, sceneHeight * 0.18);
  const skyBandDistance = Math.max(1, sceneHeight * 0.22);

  background.sprite.scale.set(scale);
  background.sprite.x = (width - background.sprite.width) / 2;

  if (scroll <= courtyardDistance) {
    background.phase = "start-courtyard";
    background.sprite.y = height - sceneHeight + scroll * 0.18;
    return;
  }

  const skyScroll = scroll - courtyardDistance;
  const band = Math.floor(skyScroll / skyBandDistance) % 3;
  background.phase = PORTRAIT_BACKGROUND_PHASES[band + 1];
  background.sprite.y = height - sceneHeight + courtyardDistance * 0.18 + (skyScroll % skyBandDistance) * 0.08;
}

export function destroyPortraitBackground(background: PortraitBackground): void {
  background.container.destroy({ children: true });
}
