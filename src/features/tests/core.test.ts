import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createGame, getGameResult, startDrop, updateGame } from "../core/core";
import { calculateScore } from "../logic/scoring";
import { getBlockY } from "../logic/rules";
import { saveScore, loadScores } from "../backend/scoreApi";
import { getLeaderboard } from "../backend/leaderboardApi";

function withMockedRandom(values: number[], fn: () => void) {
  const spy = vi.spyOn(Math, "random");
  values.forEach((value) => spy.mockReturnValueOnce(value));
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
}

describe("straw stack core", () => {
  it("creates the initial game state from the viewport width", () => {
    const state = createGame(390);
    expect(state.sub).toBe("moving");
    expect(state.blocks).toHaveLength(1);
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.mv.w).toBe(180);
  });

  it("processes a drop instantly", () => {
    const state = createGame(390);
    const result = startDrop(state, 720, 390);
    expect(result.gameOver).toBe(false);
    expect(state.sub).toBe("paused");
  });

  it("produces a perfect placement and increases score/combo", () => {
    const state = createGame(390);

    withMockedRandom(new Array(32).fill(0.5), () => {
      const result = startDrop(state, 720, 390);
      expect(result.gameOver).toBe(false);
    });

    expect(state.blocks).toHaveLength(2);
    expect(state.score).toBeGreaterThan(0);
    expect(state.combo).toBe(1);
    expect(state.lastPlacement?.kind).toBe("perfect");
  });

  it("ends the game when a drop misses the tower", () => {
    const state = createGame(390);
    const top = state.blocks[0];
    state.mv.x = top.x + top.w + 20;

    withMockedRandom([0.5, 0.5], () => {
      const result = startDrop(state, 720, 390);
      expect(result.gameOver).toBe(true);
    });

    const summary = getGameResult(state);
    expect(summary.floors).toBe(0);
    expect(state.blocks).toHaveLength(1);
  });
});

describe("score logic", () => {
  it("returns perfect, good, and base outcomes", () => {
    expect(calculateScore(2, 0)).toMatchObject({ kind: "perfect", combo: 1 });
    expect(calculateScore(20, 1)).toMatchObject({ kind: "good", combo: 0 });
    expect(calculateScore(48, 3)).toMatchObject({ kind: "base", combo: 0 });
  });
});

describe("camera rules", () => {
  it("moves blocks upward as scroll increases", () => {
    expect(getBlockY(0, 720, 0)).toBeLessThan(getBlockY(0, 720, 120));
  });
});


describe("local score boundary", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores scores and builds a ranked leaderboard", () => {
    saveScore({ playerName: "An", score: 30, floors: 2 });
    saveScore({ playerName: "Binh", score: 55, floors: 4 });

    const scores = loadScores();
    const leaderboard = getLeaderboard();

    expect(scores).toHaveLength(2);
    expect(leaderboard[0]).toMatchObject({ rank: 1, playerName: "Nguoi choi 3", score: 800 });
    expect(leaderboard[1]).toMatchObject({ rank: 2, playerName: "Nguoi choi 4", score: 700 });
  });
});
