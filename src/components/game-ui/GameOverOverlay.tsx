import { GameButton } from "../ui/primitives/GameButton";
import { PanelFrame } from "../ui/primitives/PanelFrame";

interface GameOverOverlayProps {
  score: number;
  floors: number;
  best: number;
  onReplay: () => void;
}

export function GameOverOverlay({ score, floors, best, onReplay }: GameOverOverlayProps) {
  return (
    <div className="overlay-scrim">
      <PanelFrame className="overlay-card">
        <p className="eyebrow">Thap do roi</p>
        <h2 className="overlay-title">Thu them lan nua</h2>
        <div className="result-grid">
          <div>
            <span>Diem</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Tang</span>
            <strong>{floors}</strong>
          </div>
          <div>
            <span>Ky luc</span>
            <strong>{best}</strong>
          </div>
        </div>
        <GameButton size="lg" onClick={onReplay}>
          Choi lai
        </GameButton>
      </PanelFrame>
    </div>
  );
}
