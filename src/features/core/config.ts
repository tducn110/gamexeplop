import { INITIAL_BLOCK_WIDTH } from "./constants";

export interface GameConfig {
  initialBlockWidth: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getGameConfig(viewportWidth: number): GameConfig {
  if (viewportWidth < 640) {
    return {
      // Chiều ngang quanh mức 180
      initialBlockWidth: Math.round(clamp(viewportWidth * 0.48, 160, 180)),
    };
  }

  return {
    // Trên PC cũng ưu tiên loanh quanh mức 180 cho khối vuông vức hơn
    initialBlockWidth: Math.round(clamp(viewportWidth * 0.35, 180, 220)),
  };
}
