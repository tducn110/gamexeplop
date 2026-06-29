import gsap from "gsap";
import type { Container, Sprite } from "pixi.js";

export function pulsePlacement(sprite: Sprite | null, strength = 1.12) {
  if (!sprite) return;
  gsap.killTweensOf(sprite.scale);
  sprite.scale.set(sprite.scale.x, sprite.scale.y);
  gsap.timeline()
    .to(sprite.scale, { x: sprite.scale.x * strength, y: sprite.scale.y * strength, duration: 0.08 })
    .to(sprite.scale, { x: sprite.scale.x, y: sprite.scale.y, duration: 0.12, ease: "power2.out" });
}

export function shakeLayer(layer: Container) {
  gsap.killTweensOf(layer.position);
  return gsap.timeline()
    .to(layer.position, { x: -4, duration: 0.04 })
    .to(layer.position, { x: 4, duration: 0.06 })
    .to(layer.position, { x: 0, duration: 0.08, ease: "power2.out" });
}

export function killLayerTweens(layer: Container) {
  gsap.killTweensOf(layer.position);
}
