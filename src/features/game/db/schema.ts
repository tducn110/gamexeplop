export interface ScoreRecord {
  id: string;
  playerName: string;
  score: number;
  floors: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  floors: number;
}
