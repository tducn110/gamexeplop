import { loadScores } from "./scoreApi";
import type { LeaderboardEntry } from "../db/schema";

export function getLeaderboard(): LeaderboardEntry[] {
  return loadScores()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      playerName: item.playerName,
      score: item.score,
      floors: item.floors,
    }));
}
