import type { GameState } from "../core/types";

import { getGameConfig } from "../core/config";
import { getMovingMotion } from "./progression";

export function createInitialState(viewportWidth: number): GameState {
  const config = getGameConfig(viewportWidth);
  const baseWidth = config.initialBlockWidth;
  const motion = getMovingMotion(0, viewportWidth);
  return {
    sub: "moving",
    blocks: [{ x: (viewportWidth - baseWidth) / 2, w: baseWidth }],
    mv: {
      x: (viewportWidth - baseWidth) / 2,
      w: baseWidth,
      dir: 1,
      spd: motion.speed,
      acc: motion.acc,
      maxSpd: motion.maxSpd,
    },
    drop: null,
    pieces: [],
    sparks: [],
    flashes: [],
    scroll: 0,
    scrollT: 0,
    height: 0,
    bonusScore: 0,
    score: 0,
    combo: 0,
    placed: 0,
    pauseT: 0,
    crashT: 0,
    elapsedMs: 0,

    flashId: 1,
    lastPlacement: null,
    perfectHighlight: null,
  };
}
