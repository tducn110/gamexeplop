export interface ScoreRecord {
  id: string;
  playerName: string;
  score: number;
  floors: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id?: string;
  rank: number;
  playerName: string;
  score: number;
  floors: number | null;
  isCurrentPlayer?: boolean;
}
