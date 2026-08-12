import { Graphics, type Container } from "pixi.js";
import type { GameState } from "../../core/types";

export function syncSparkGraphics(layer: Graphics, state: GameState) {
  layer.clear();
  for (const spark of state.sparks) {
    layer.circle(spark.x, spark.y, spark.r);
    layer.fill({ color: spark.c, alpha: spark.alpha });
  }
}

export function clearEffects(layer: Container) {
  layer.removeChildren();
}
