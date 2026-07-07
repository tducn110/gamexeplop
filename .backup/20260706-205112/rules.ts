import type { GameState } from "../core/types";
import { BLOCK_HEIGHT, BLOCK_STEP, CAMERA_TOP, GROUND_RATIO } from "../core/constants";

export function getBlockY(level: number, viewportHeight: number, scroll: number) {
  return viewportHeight * GROUND_RATIO - level * BLOCK_STEP - BLOCK_HEIGHT + scroll;
}

export function getTargetScroll(topLevel: number, viewportHeight: number) {
  return Math.max(0, viewportHeight * (CAMERA_TOP - GROUND_RATIO) + topLevel * BLOCK_STEP + BLOCK_HEIGHT);
}

export function getFloors(state: GameState) {
  return Math.max(0, state.blocks.length - 1);
}
