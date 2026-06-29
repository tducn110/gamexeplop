import type { ScoreRecord } from "./schema";

export function createScoreRecord(playerName: string, score: number, floors: number): ScoreRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName,
    score,
    floors,
    createdAt: new Date().toISOString(),
  };
}
