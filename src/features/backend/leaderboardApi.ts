import { loadScores } from "./scoreApi";
import type { LeaderboardEntry } from "../db/schema";

export function getLeaderboard(): LeaderboardEntry[] {
  const realScores = loadScores().sort((a, b) => b.score - a.score);
  
  const mockNames = [
    "Nguoi choi 1", "Nguoi choi 2", "Nguoi choi 3", "Nguoi choi 4", 
    "Nguoi choi 5", "Nguoi choi 6", "Nguoi choi 7", "Nguoi choi 8", 
    "Nguoi choi 9", "Nguoi choi 10"
  ];
  
  const combined = [...realScores];
  
  // Fill up to 10 items with mock data
  while (combined.length < 10) {
    const i = combined.length;
    combined.push({
      id: `mock-${i}`,
      playerName: mockNames[i],
      score: Math.max(0, 1000 - i * 100),
      floors: Math.max(0, 50 - i * 5),
      createdAt: new Date().toISOString(),
    });
  }
  
  return combined
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      playerName: item.playerName,
      score: item.score,
      floors: item.floors,
    }));
}
