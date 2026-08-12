import {
  ACCELERATION_INCREASE,
  INITIAL_ACCELERATION,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREASE,
} from "../core/constants";

export function getMovingSpeed(placed: number, viewportWidth: number = 400) {
  const baseSpeed = Math.min(INITIAL_SPEED + placed * SPEED_INCREASE, MAX_SPEED);
  const scale = Math.max(1, viewportWidth / 400); // Scale up for larger screens
  return baseSpeed * scale;
}

export function getMovingMotion(placed: number, viewportWidth: number = 400) {
  const speed = getMovingSpeed(placed, viewportWidth);
  const scale = Math.max(1, viewportWidth / 400);
  
  const acc = Math.min(INITIAL_ACCELERATION + placed * ACCELERATION_INCREASE, 48) * scale;
  const maxSpd = Math.min((INITIAL_SPEED + placed * SPEED_INCREASE) + 52 + placed * 5, MAX_SPEED) * scale;

  return { speed, acc, maxSpd };
}
