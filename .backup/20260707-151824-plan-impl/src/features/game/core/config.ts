import { INITIAL_BLOCK_WIDTH } from "./constants";

export interface GameConfig {
  initialBlockWidth: number;
}

export function getGameConfig(viewportWidth: number): GameConfig {
  return {
    initialBlockWidth: Math.min(INITIAL_BLOCK_WIDTH + 52, viewportWidth * 0.82),
  };
}
