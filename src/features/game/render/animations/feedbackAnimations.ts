import type { Container, Sprite } from "pixi.js";
import { killLayerTweens, pulsePlacement, shakeLayer } from "./gsapTimelines";

export function runPlacementAnimation(kind: "perfect" | "good" | "base", sprite: Sprite | null, worldLayer: Container) {
  if (kind === "perfect") {
    pulsePlacement(sprite, 1.18);
  } else if (kind === "good") {
    pulsePlacement(sprite, 1.1);
  } else {
    shakeLayer(worldLayer);
  }
}

export function destroyFeedbackAnimations(worldLayer: Container) {
  killLayerTweens(worldLayer);
}
