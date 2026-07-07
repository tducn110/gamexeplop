import { readStorage, writeStorage } from "@/lib/storage";
import { createScoreRecord } from "../db/scoreRecord";
import type { ScoreRecord } from "../db/schema";

const SCORE_KEY = "straw_stack_scores_v1";

export interface SaveScoreInput {
  playerName: string;
  score: number;
  floors: number;
}

export function loadScores() {
  return readStorage<ScoreRecord[]>(SCORE_KEY, []);
}

export function saveScore(input: SaveScoreInput) {
  const record = createScoreRecord(input.playerName || "Khach", input.score, input.floors);
  const next = [record, ...loadScores()].sort((a, b) => b.score - a.score).slice(0, 20);
  writeStorage(SCORE_KEY, next);
  return record;
}

export function getBestScore() {
  return loadScores().reduce((best, item) => Math.max(best, item.score), 0);
}
