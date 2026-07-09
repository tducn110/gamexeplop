import { RotateCcw, Trophy } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";
import type { CharacterAsset } from "@/features/characters/characterAssets";

interface GameOverScreenProps {
  score: number;
  best: number;
  floors: number;
  running: boolean;
  visible: boolean;
  countdown: number | null;
  character: CharacterAsset;
  onRetry: () => void;
}

export function GameOverScreen({
  score,
  best,
  floors,
  running,
  visible,
  countdown,
  character,
  onRetry,
}: GameOverScreenProps) {
  if (!visible || running || countdown !== null) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverPresentation">
        <img className="gameOverCharacter" src={character.src} alt="" aria-hidden="true" />
        <div className="gameOverCard">
          <div className="gameOverKicker">
            <Trophy size={18} />
            Chim trời đã chặn đường
          </div>
          <h2 className="gameOverTitle">Game Over</h2>

          <div className="gameOverScoreBlock">
            <span>Điểm độ cao</span>
            <strong>{score.toLocaleString("vi-VN")}</strong>
          </div>

          <div className="gameOverStats">
            <div>
              <span>Độ cao</span>
              <strong>{floors} tầng</strong>
            </div>
            <div>
              <span>Kỷ lục</span>
              <strong>{best.toLocaleString("vi-VN")}</strong>
            </div>
          </div>

          <GameButton variant="primary" size="lg" onClick={onRetry} style={{ width: "100%" }}>
            <RotateCcw size={18} />
            Chơi lại
          </GameButton>
        </div>
      </div>
    </div>
  );
}
