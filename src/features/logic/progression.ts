import {
  ACCELERATION_INCREASE,
  INITIAL_ACCELERATION,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREASE,
} from "../core/constants";

export function getMovingSpeed(placed: number) {
  return Math.min(INITIAL_SPEED + placed * SPEED_INCREASE, MAX_SPEED);
}

export function getMovingMotion(placed: number) {
  const speed = getMovingSpeed(placed);
  const acc = Math.min(INITIAL_ACCELERATION + placed * ACCELERATION_INCREASE, 48);
  const maxSpd = Math.min(speed + 52 + placed * 5, MAX_SPEED);

  return { speed, acc, maxSpd };
}
