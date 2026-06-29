import { INITIAL_SPEED, MAX_SPEED, SPEED_INCREASE } from "../core/constants";

export function getMovingSpeed(placed: number) {
  return Math.min(INITIAL_SPEED + placed * SPEED_INCREASE, MAX_SPEED);
}
