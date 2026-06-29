import { ChartColumnBig, Settings, UserRound } from "lucide-react";
import { GameButton } from "../ui/primitives/GameButton";
import { IconButton } from "../ui/primitives/IconButton";

interface GameHudProps {
  score: number;
  best: number;
  floors: number;
  combo: number;
  playerName: string;
  showHints: boolean;
  onDashboard: () => void;
  onSettings: () => void;
  onLogin: () => void;
  onRestart: () => void;
}

export function GameHud({
  score,
  best,
  floors,
  combo,
  playerName,
  showHints,
  onDashboard,
  onSettings,
  onLogin,
  onRestart,
}: GameHudProps) {
  return (
    <div className="hud-layer">
      <div className="hud-topbar">
        <div className="hud-badges">
          <div className="hud-score-card">
            <span>Diem</span>
            <strong>{score}</strong>
          </div>
          <div className="hud-score-card">
            <span>Ky luc</span>
            <strong>{best}</strong>
          </div>
          <div className="hud-score-card">
            <span>Tang</span>
            <strong>{floors}</strong>
          </div>
        </div>
        <div className="hud-actions">
          <IconButton aria-label="Nguoi choi" onClick={onLogin}>
            <UserRound size={18} />
          </IconButton>
          <IconButton aria-label="Bang diem" onClick={onDashboard}>
            <ChartColumnBig size={18} />
          </IconButton>
          <IconButton aria-label="Cai dat" onClick={onSettings}>
            <Settings size={18} />
          </IconButton>
        </div>
      </div>

      <div className="hud-bottombar">
        <div className="hud-player">Nguoi choi: {playerName}</div>
        <div className="hud-hints">
          {combo >= 2 ? <span className="hud-combo">Combo x{combo}</span> : null}
          {showHints ? <span>Cham de tha bo rom</span> : null}
        </div>
        <GameButton variant="secondary" size="sm" onClick={onRestart}>
          Van moi
        </GameButton>
      </div>
    </div>
  );
}
