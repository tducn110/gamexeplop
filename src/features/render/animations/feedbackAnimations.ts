import type { Container } from "pixi.js";
import { killLayerTweens, pulsePlacement, shakeLayer } from "./gsapTimelines";

export function runPlacementAnimation(kind: "perfect" | "good" | "base", sprite: Container | null, worldLayer: Container, combo = 0, reducedMotion = false) {
  if (kind === "perfect") {
    pulsePlacement(sprite, 1.35); // Increased pulse
    if (!reducedMotion) shakeLayer(worldLayer, 8 + Math.min(combo, 15) * 1.5); // Increased shake
  } else if (kind === "good") {
    pulsePlacement(sprite, 1.15);
    if (!reducedMotion) shakeLayer(worldLayer, 5); // Increased shake
  } else {
    if (!reducedMotion) shakeLayer(worldLayer, 2.5); // Added slight shake for base
  }
}

export function destroyFeedbackAnimations(worldLayer: Container) {
  killLayerTweens(worldLayer);
}
