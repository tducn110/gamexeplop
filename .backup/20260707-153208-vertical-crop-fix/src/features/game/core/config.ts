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
      initialBlockWidth: Math.round(clamp(viewportWidth * 0.32, 118, 142)),
    };
  }

  return {
    initialBlockWidth: Math.round(clamp(viewportWidth * 0.24, 170, 260)),
  };
}
