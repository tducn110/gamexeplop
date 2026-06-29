import type { LeaderboardEntry } from "@/features/game/db/schema";
import { GameButton } from "../ui/primitives/GameButton";
import { PanelFrame } from "../ui/primitives/PanelFrame";
import { StatRow } from "../ui/primitives/StatRow";

interface DashboardPanelProps {
  open: boolean;
  best: number;
  lastScore: number;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  onOpenLogin: () => void;
}

export function DashboardPanel({ open, best, lastScore, leaderboard, onClose, onOpenLogin }: DashboardPanelProps) {
  if (!open) return null;
  return (
    <div className="overlay-scrim">
      <PanelFrame className="side-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bang diem</p>
            <h2 className="panel-title">Hanh trinh cua ban</h2>
          </div>
          <GameButton variant="ghost" size="sm" onClick={onClose}>
            Dong
          </GameButton>
        </div>

        <div className="stack-col">
          <StatRow label="Ky luc" value={String(best)} accent="var(--orange-cta-edge)" />
          <StatRow label="Lan truoc" value={String(lastScore)} />
        </div>

        <div className="leaderboard-list">
          {leaderboard.length === 0 ? <p className="muted-copy">Chua co diem nao duoc luu.</p> : null}
          {leaderboard.map((entry) => (
            <div key={`${entry.rank}-${entry.playerName}-${entry.score}`} className="leaderboard-row">
              <span>#{entry.rank}</span>
              <span>{entry.playerName}</span>
              <strong>{entry.score}</strong>
            </div>
          ))}
        </div>

        <GameButton variant="secondary" onClick={onOpenLogin}>
          Sua ten nguoi choi
        </GameButton>
      </PanelFrame>
    </div>
  );
}
