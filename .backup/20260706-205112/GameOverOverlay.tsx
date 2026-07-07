import { Clapperboard } from "lucide-react";
import { AdDoubleScoreButton } from "./AdDoubleScoreButton";
import { GameButton } from "../ui/primitives/GameButton";

interface GameOverOverlayProps {
  finalScore: number | null;
  displayScore: number | null;
  running: boolean;
  visible: boolean;
  countdown: number | null;
  mode: "continue" | "summary";
  canContinue: boolean;
  canDoubleScore: boolean;
  onContinue: () => void;
  onDeclineContinue: () => void;
  onDoubleScore: () => void;
  onEndGame: () => void;
}

export function GameOverOverlay({
  finalScore,
  displayScore,
  running,
  visible,
  countdown,
  mode,
  canContinue,
  canDoubleScore,
  onContinue,
  onDeclineContinue,
  onDoubleScore,
  onEndGame,
}: GameOverOverlayProps) {
  if (!visible || running || countdown !== null || finalScore === null || displayScore === null) return null;

  if (mode === "continue" && canContinue) {
    return (
      <div className="gameOverOverlay" style={{ opacity: 0, animation: "fadeIn 0.3s forwards" }}>
        <style>{`
          @keyframes fadeIn { to { opacity: 1; } }
        `}</style>
        <div className="gameOverCard">
          <div className="scoreCard scoreCard-continue">
            <div className="scoreLabel">Tiếp tục?</div>
            <div className="scoreMeta">Bạn muốn xem quảng cáo để chơi tiếp hay chốt điểm hiện tại?</div>
          </div>

          <div className="gameOverChoiceRow" style={{ display: "flex", gap: 10, width: "100%", marginTop: 16 }}>
            <GameButton variant="primary" size="lg" onClick={onContinue} style={{ flex: 1, padding: "0 12px" }}>
              <Clapperboard size={18} strokeWidth={2.6} />
              Tiếp tục chơi
            </GameButton>
            <GameButton variant="secondary" size="lg" onClick={onDeclineContinue} style={{ flex: 0.6 }}>
              Không
            </GameButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gameOverOverlay" style={{ opacity: 0, animation: "fadeIn 0.3s forwards" }}>
      <style>{`
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
      <div className="gameOverCard">
        <div className="scoreCard">
          <div className="scoreLabel">Điểm số</div>
          <div className="scoreValue" style={{ fontSize: "42px", margin: "10px 0" }}>{displayScore.toLocaleString("vi-VN")}</div>
          <div className="scoreMeta">
            {canDoubleScore ? "Chọn nhân đôi điểm hoặc kết thúc game." : "Điểm đã được nhân đôi. Chọn kết thúc game."}
          </div>
        </div>

        <AdDoubleScoreButton score={finalScore} onClick={onDoubleScore} disabled={!canDoubleScore} />

        <GameButton variant="secondary" size="lg" onClick={onEndGame} style={{ width: "100%" }}>
          Kết thúc game
        </GameButton>
      </div>
    </div>
  );
}
