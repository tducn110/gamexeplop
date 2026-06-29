import { calculateOverlap } from "../logic/collision";
import { getMovingSpeed } from "../logic/progression";
import { calculateScore } from "../logic/scoring";
import { createInitialState } from "../logic/spawning";
import { getBlockY, getTargetScroll } from "../logic/rules";
import {
  DROP_ACCELERATION,
  MIN_BLOCK_WIDTH,
  MOVING_BLOCK_OFFSET,
  PAUSE_MS,
  PIECE_GRAVITY,
  PERFECT_TOLERANCE,
  SPARK_COLORS,
} from "./constants";
import type { FloatingFlash, GameResult, GameState } from "./types";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function addFlash(state: GameState, txt: string, x: number, y: number, c: string, sz: number) {
  const flash: FloatingFlash = { id: state.flashId++, txt, x, y, alpha: 1, c, vy: -1.9, sz };
  state.flashes.push(flash);
}

export function createGame(viewportWidth: number) {
  return createInitialState(viewportWidth);
}

export function startDrop(state: GameState, viewportHeight: number) {
  if (state.sub !== "moving") return false;
  const topY = getBlockY(state.blocks.length - 1, viewportHeight, state.scroll);
  const movingY = topY - MOVING_BLOCK_OFFSET;
  state.drop = { x: state.mv.x, y: movingY, w: state.mv.w, vy: 1.5 };
  state.sub = "dropping";
  return true;
}

export function getMovingBlockY(state: GameState, viewportHeight: number) {
  const topY = getBlockY(state.blocks.length - 1, viewportHeight, state.scroll);
  return topY - MOVING_BLOCK_OFFSET;
}

export function getGameResult(state: GameState): GameResult {
  return {
    score: state.score,
    floors: Math.max(0, state.blocks.length - 1),
  };
}

export function updateGame(state: GameState, dt: number, viewportWidth: number, viewportHeight: number) {
  const topLevel = state.blocks.length - 1;
  state.scrollT = getTargetScroll(topLevel, viewportHeight);
  state.scroll = lerp(state.scroll, state.scrollT, 0.065);

  for (let index = state.pieces.length - 1; index >= 0; index -= 1) {
    const piece = state.pieces[index];
    piece.vy += PIECE_GRAVITY;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rot += piece.vrot;
    piece.alpha -= 0.013;
    if (piece.alpha <= 0) state.pieces.splice(index, 1);
  }

  for (let index = state.sparks.length - 1; index >= 0; index -= 1) {
    const spark = state.sparks[index];
    spark.vy += 0.3;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.alpha -= 0.024;
    if (spark.alpha <= 0) state.sparks.splice(index, 1);
  }

  for (let index = state.flashes.length - 1; index >= 0; index -= 1) {
    const flash = state.flashes[index];
    flash.y += flash.vy;
    flash.alpha -= 0.02;
    if (flash.alpha <= 0) state.flashes.splice(index, 1);
  }

  if (state.sub === "moving") {
    state.mv.x += state.mv.dir * state.mv.spd;
    if (state.mv.x <= 0) {
      state.mv.x = 0;
      state.mv.dir = 1;
    }
    if (state.mv.x + state.mv.w >= viewportWidth) {
      state.mv.x = viewportWidth - state.mv.w;
      state.mv.dir = -1;
    }
  }

  if (state.sub === "dropping" && state.drop) {
    state.drop.vy += DROP_ACCELERATION;
    state.drop.y += state.drop.vy;

    const landY = getBlockY(state.blocks.length, viewportHeight, state.scroll);
    if (state.drop.y >= landY) {
      const top = state.blocks[topLevel];
      const aLeft = state.drop.x;
      const aRight = state.drop.x + state.drop.w;
      const bLeft = top.x;
      const bRight = top.x + top.w;
      const overlapResult = calculateOverlap(aLeft, aRight, bLeft, bRight);

      if (overlapResult.overlap <= 0) {
        state.pieces.push({
          x: state.drop.x,
          y: landY,
          w: state.drop.w,
          vx: rand(-2, 2),
          vy: -1,
          rot: 0,
          vrot: rand(-0.07, 0.07),
          alpha: 1,
        });
        state.drop = null;
        return { gameOver: true, placement: null };
      }

      const isPerfect = overlapResult.totalCut <= PERFECT_TOLERANCE;
      const newWidth = isPerfect ? state.drop.w : overlapResult.overlap;
      const newX = isPerfect ? state.drop.x : overlapResult.overlapLeft;
      state.blocks.push({ x: newX, w: newWidth });

      const outcome = calculateScore(overlapResult.totalCut, state.combo);
      state.combo = outcome.combo;
      state.score += outcome.scoreDelta;
      state.lastPlacement = {
        token: Date.now() + Math.floor(Math.random() * 1000),
        kind: outcome.kind,
        combo: outcome.combo,
        scoreDelta: outcome.scoreDelta,
      };

      if (outcome.kind === "perfect") {
        addFlash(state, "Chuan!", newX + newWidth / 2, landY - 12, "#e87432", 24);
      } else if (outcome.kind === "good") {
        addFlash(state, "Tot!", newX + newWidth / 2, landY - 12, "#6b8e3d", 20);
      }

      if (state.combo >= 3) {
        addFlash(state, `x${state.combo}`, viewportWidth - 60, 65, "#e87432", 19);
      }

      if (!isPerfect) {
        const cutLeft = overlapResult.overlapLeft - aLeft;
        const cutRight = aRight - overlapResult.overlapRight;

        if (cutLeft >= 3) {
          state.pieces.push({
            x: aLeft,
            y: landY,
            w: cutLeft,
            vx: rand(-3, -1.2),
            vy: rand(-2, 0.5),
            rot: 0,
            vrot: rand(-0.08, -0.02),
            alpha: 1,
          });
        }

        if (cutRight >= 3) {
          state.pieces.push({
            x: overlapResult.overlapRight,
            y: landY,
            w: cutRight,
            vx: rand(1.2, 3),
            vy: rand(-2, 0.5),
            rot: 0,
            vrot: rand(0.02, 0.08),
            alpha: 1,
          });
        }
      }

      for (let index = 0; index < 16; index += 1) {
        state.sparks.push({
          x: rand(overlapResult.overlapLeft + 4, overlapResult.overlapRight - 4),
          y: landY,
          vx: rand(-3.5, 3.5),
          vy: rand(-5, -1.2),
          r: rand(2, 5),
          alpha: 1,
          c: SPARK_COLORS[Math.floor(rand(0, SPARK_COLORS.length))],
        });
      }

      if (newWidth <= MIN_BLOCK_WIDTH) {
        state.drop = null;
        return { gameOver: true, placement: outcome };
      }

      state.placed += 1;
      state.drop = null;
      state.sub = "paused";
      state.pauseT = PAUSE_MS;
      return { gameOver: false, placement: outcome };
    }
  }

  if (state.sub === "paused") {
    state.pauseT -= dt;
    if (state.pauseT <= 0) {
      const top = state.blocks[state.blocks.length - 1];
      const speed = getMovingSpeed(state.placed);
      const startLeft = state.placed % 2 === 0;
      state.mv = {
        x: startLeft ? 0 : viewportWidth - top.w,
        w: top.w,
        dir: startLeft ? 1 : -1,
        spd: speed,
      };
      state.sub = "moving";
    }
  }

  return { gameOver: false, placement: null };
}
