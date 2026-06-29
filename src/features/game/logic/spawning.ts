import type { GameState } from "../core/types";
import { INITIAL_BLOCK_WIDTH, INITIAL_SPEED } from "../core/constants";
import { getGameConfig } from "../core/config";

export function createInitialState(viewportWidth: number): GameState {
  const config = getGameConfig(viewportWidth);
  const baseWidth = config.initialBlockWidth;
  return {
    sub: "moving",
    blocks: [{ x: (viewportWidth - baseWidth) / 2, w: baseWidth }],
    mv: { x: (viewportWidth - INITIAL_BLOCK_WIDTH) / 2, w: INITIAL_BLOCK_WIDTH, dir: 1, spd: INITIAL_SPEED },
    drop: null,
    pieces: [],
    sparks: [],
    flashes: [],
    scroll: 0,
    scrollT: 0,
    score: 0,
    combo: 0,
    placed: 0,
    pauseT: 0,
    flashId: 1,
    lastPlacement: null,
  };
}
