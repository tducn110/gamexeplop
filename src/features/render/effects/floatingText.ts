import { Text, type Container } from "pixi.js";
import type { FloatingFlash, GameState } from "../../core/types";

export function syncFloatingTexts(container: Container, state: GameState, map: Map<number, Text>) {
  const activeIds = new Set<number>();

  for (const flash of state.flashes) {
    activeIds.add(flash.id);
    let text = map.get(flash.id);
    if (!text) {
      text = new Text({
        text: flash.txt,
        style: {
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: flash.sz,
          fontWeight: "800",
          fill: flash.c,
          stroke: { color: 0xffffff, width: 3 },
        },
      });
      text.anchor.set(0.5);
      container.addChild(text);
      map.set(flash.id, text);
    }

    text.text = flash.txt;
    text.x = flash.x;
    text.y = flash.y;
    text.alpha = Math.min(flash.alpha, 1);
    
    // Juicy pop effect: scale up when alpha is high
    let scale = 1;
    if (flash.alpha > 0.8) {
      scale = 1 + (flash.alpha - 0.8) * 2; // Pops to 1.4 then settles at 1.0
    }
    text.scale.set(scale);
    
    text.style.fill = flash.c;
    text.style.fontSize = flash.sz;
  }

  for (const [id, text] of map.entries()) {
    if (!activeIds.has(id)) {
      text.destroy();
      map.delete(id);
    }
  }
}
