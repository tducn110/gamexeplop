import gsap from "gsap";
import type { Container } from "pixi.js";

export function pulsePlacement(sprite: Container | null, strength = 1.12) {
  if (!sprite) return;
  gsap.killTweensOf(sprite.scale);
  // Squash and stretch effect
  gsap.timeline()
    .to(sprite.scale, { x: strength + 0.1, y: strength - 0.1, duration: 0.08, ease: "power1.out" })
    .to(sprite.scale, { x: 1, y: 1, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
}

export function shakeLayer(layer: Container, intensity = 4) {
  gsap.killTweensOf(layer.position);
  return gsap.timeline()
    .to(layer.position, { x: -intensity, y: intensity * 0.2, duration: 0.04 })
    .to(layer.position, { x: intensity, y: -intensity * 0.2, duration: 0.06 })
    .to(layer.position, { x: 0, y: 0, duration: 0.08, ease: "power2.out" });
}

export function killLayerTweens(layer: Container) {
  gsap.killTweensOf(layer.position);
}
