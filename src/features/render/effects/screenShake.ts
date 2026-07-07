import type { Container } from "pixi.js";

export function resetScreenShake(layer: Container) {
  layer.position.set(0, 0);
}
