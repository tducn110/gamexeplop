import type { Container } from "pixi.js";
import { killLayerTweens, pulsePlacement, shakeLayer } from "./gsapTimelines";

export function runPlacementAnimation(kind: "perfect" | "good" | "base", sprite: Container | null, worldLayer: Container, combo = 0) {
  if (kind === "perfect") {
    pulsePlacement(sprite, 1.25);
    shakeLayer(worldLayer, 4 + Math.min(combo, 15) * 0.5);
  } else if (kind === "good") {
    pulsePlacement(sprite, 1.1);
    shakeLayer(worldLayer, 2.5);
  } else {
    shakeLayer(worldLayer, 1.5);
  }
}

export function destroyFeedbackAnimations(worldLayer: Container) {
  killLayerTweens(worldLayer);
}
