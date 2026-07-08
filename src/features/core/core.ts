import { calculateOverlap } from "../logic/collision";
import { getMovingMotion } from "../logic/progression";
import { calculateScore } from "../logic/scoring";
import { createInitialState } from "../logic/spawning";
import { getBlockY, getTargetScroll } from "../logic/rules";
import {

  DROP_ACCELERATION,
  DRAG_SCORE_FACTOR,
  HEIGHT_SCORE_PER_FLOOR,
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
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));


function addFlash(state: GameState, txt: string, x: number, y: number, c: string, sz: number) {
  const flash: FloatingFlash = { id: state.flashId++, txt, x, y, alpha: 1, c, vy: -1.9, sz };
  state.flashes.push(flash);
}

function syncHeightScore(state: GameState) {
  const floorHeight = Math.max(0, state.blocks.length - 1) * HEIGHT_SCORE_PER_FLOOR;
  const cameraHeight = Math.max(0, Math.round(state.scroll * 0.08));
  state.height = Math.max(state.height, floorHeight + cameraHeight);
  state.score = state.height + state.bonusScore;
}

function makeMovingBlock(state: GameState, viewportWidth: number) {
  const top = state.blocks[state.blocks.length - 1];
  const motion = getMovingMotion(state.placed, viewportWidth);
  const startLeft = state.placed % 2 === 0;

  state.mv = {
    x: startLeft ? 0 : viewportWidth - top.w,
    w: top.w,
    dir: startLeft ? 1 : -1,
    spd: motion.speed,
    acc: motion.acc,
    maxSpd: motion.maxSpd,
  };
}

function getBlockRect(x: number, y: number, w: number) {
  return { x, y, w, h: 44 };
}

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createGame(viewportWidth: number) {
  return createInitialState(viewportWidth);
}

export function startDrop(
  state: GameState,
  viewportHeight: number,
  viewportWidth: number,
  climbDistance = 0
): { gameOver: boolean; placement: any } {
  if (state.sub !== "moving") return { gameOver: false, placement: null };
  
  const topLevel = state.blocks.length - 1;
  const landY = getBlockY(state.blocks.length, viewportHeight, state.scroll);
  
  const top = state.blocks[topLevel];
  const aLeft = state.mv.x;
  const aRight = state.mv.x + state.mv.w;
  const bLeft = top.x;
  const bRight = top.x + top.w;
  const overlapResult = calculateOverlap(aLeft, aRight, bLeft, bRight);

  if (overlapResult.overlap <= 0) {
    state.pieces.push({
      x: state.mv.x,
      y: landY,
      w: state.mv.w,
      vx: rand(-2, 2),
      vy: -1,
      rot: 0,
      vrot: rand(-0.07, 0.07),
      alpha: 1,
    });
    state.sub = "crashing";
    state.crashT = 0;
    return { gameOver: false, placement: null };
  }

  const isPerfect = overlapResult.totalCut <= PERFECT_TOLERANCE;
  const outcome = calculateScore(overlapResult.totalCut, state.combo);

  let newWidth = isPerfect ? state.mv.w : overlapResult.overlap;
  let newX = isPerfect ? state.mv.x : overlapResult.overlapLeft;

  state.blocks.push({ x: newX, w: newWidth });
  state.combo = outcome.combo;
  state.bonusScore += outcome.scoreDelta + Math.round(Math.max(0, climbDistance) * DRAG_SCORE_FACTOR);
  syncHeightScore(state);
  state.lastPlacement = {
    token: Date.now() + Math.floor(Math.random() * 1000),
    kind: outcome.kind,
    combo: outcome.combo,
    scoreDelta: outcome.scoreDelta,
  };

  if (outcome.kind === "perfect") {
    addFlash(state, "Chuẩn!", newX + newWidth / 2, landY - 12, "#e87432", 24);
    state.perfectHighlight = { x: newX, y: landY, w: newWidth, alpha: 1 };
  } else if (outcome.kind === "good") {
    addFlash(state, "Rất gần!", newX + newWidth / 2, landY - 12, "#ff007f", 24);
  }

  if (state.combo >= 3) {
    addFlash(state, `x${state.combo}`, viewportWidth - 60, 65, "#e87432", 19);
  }

  if (!isPerfect) {
    const cutLeft = overlapResult.overlapLeft - aLeft;
    const cutRight = aRight - overlapResult.overlapRight;

    if (cutLeft >= 3) {
      state.pieces.push({
        x: aLeft, y: landY, w: cutLeft,
        vx: rand(-3, -1.2), vy: rand(-2, 0.5), rot: 0, vrot: rand(-0.08, -0.02), alpha: 1,
      });
    }

    if (cutRight >= 3) {
      state.pieces.push({
        x: overlapResult.overlapRight, y: landY, w: cutRight,
        vx: rand(1.2, 3), vy: rand(-2, 0.5), rot: 0, vrot: rand(0.02, 0.08), alpha: 1,
      });
    }
  }

  let sparkCount = 0;
  let vxMin = -2, vxMax = 2;
  let vyMin = -3, vyMax = 0;

  if (outcome.kind === "perfect") {
    sparkCount = 35;
    vxMin = -6; vxMax = 6;
    vyMin = -7; vyMax = -2;
  } else if (outcome.kind === "good") {
    sparkCount = 15;
    vxMin = -3; vxMax = 3;
    vyMin = -5; vyMax = -1;
  }

  for (let index = 0; index < sparkCount; index += 1) {
    state.sparks.push({
      x: rand(overlapResult.overlapLeft + 4, overlapResult.overlapRight - 4),
      y: landY,
      vx: rand(vxMin, vxMax),
      vy: rand(vyMin, vyMax),
      r: rand(2, outcome.kind === "perfect" ? 6 : 4),
      alpha: 1,
      c: SPARK_COLORS[Math.floor(rand(0, SPARK_COLORS.length))],
    });
  }

  if (newWidth <= MIN_BLOCK_WIDTH) {
    state.sub = "crashing";
    state.crashT = 0;
    return { gameOver: false, placement: outcome };
  }

  state.placed += 1;

  state.sub = "paused";
  state.pauseT = PAUSE_MS;
  return { gameOver: false, placement: outcome };
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

export function reviveGame(state: GameState, viewportWidth: number) {
  const top = state.blocks[state.blocks.length - 1];
  
  // slightly increase width to make it easier to recover
  let w = top.w;
  if (w < MIN_BLOCK_WIDTH * 2) {
    w = Math.min(MIN_BLOCK_WIDTH * 2.5, viewportWidth);
    top.w = w;
  }
  
  makeMovingBlock(state, viewportWidth);
  state.sub = "moving";
  state.pieces = [];
  state.drop = null;
}

export function updateGame(state: GameState, dt: number, viewportWidth: number, viewportHeight: number) {
  if (state.sub !== "gameOver") {
    state.elapsedMs += dt;
  }

  const topLevel = state.blocks.length - 1;
  state.scrollT = getTargetScroll(topLevel, viewportHeight);
  state.scroll = lerp(state.scroll, state.scrollT, 0.065);
  syncHeightScore(state);

  if (state.sub === "gameOver") {
    state.crashT += dt;
  }



  if (state.perfectHighlight) {
    state.perfectHighlight.alpha -= 0.05;
    state.perfectHighlight.w += 2;
    state.perfectHighlight.x -= 1;
    state.perfectHighlight.y -= 1;
    if (state.perfectHighlight.alpha <= 0) {
      state.perfectHighlight = null;
    }
  }
  for (let index = state.pieces.length - 1; index >= 0; index -= 1) {
    const piece = state.pieces[index];
    piece.vy += PIECE_GRAVITY;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rot += piece.vrot;
    piece.alpha -= 0.013;
    if (piece.alpha <= 0 || piece.y + state.scroll > viewportHeight + 150) {
      state.pieces.splice(index, 1);
    }
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
    const seconds = dt / 1000;
    state.mv.spd = Math.min(state.mv.spd + state.mv.acc * seconds, state.mv.maxSpd);
    state.mv.x += state.mv.dir * state.mv.spd * seconds;
    if (state.mv.x <= 0) {
      state.mv.x = 0;
      state.mv.dir = 1;
    }
    if (state.mv.x + state.mv.w >= viewportWidth) {
      state.mv.x = viewportWidth - state.mv.w;
      state.mv.dir = -1;
    }
  }

  if (state.sub === "paused") {
    state.pauseT -= dt;
    if (state.pauseT <= 0) {
      const top = state.blocks[state.blocks.length - 1];
      void top;
      makeMovingBlock(state, viewportWidth);
      state.sub = "moving";
    }
  }

  if (state.sub === "crashing" && state.pieces.length === 0) {
    state.sub = "gameOver";
    state.crashT = 0;
  }

  if (state.sub === "gameOver") {
    return { gameOver: true, placement: null };
  }

  return { gameOver: false, placement: null };
}
