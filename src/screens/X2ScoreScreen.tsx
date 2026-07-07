import { Clapperboard, FastForward, Trophy } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";
import { GAME_TEXT } from "@/features/core/gameText";

interface X2ScoreScreenProps {
  score: number;
  running: boolean;
  visible: boolean;
  onWatchAd: () => void;
  onSkip: () => void;
}

export function X2ScoreScreen({
  score,
  running,
  visible,
  onWatchAd,
  onSkip,
}: X2ScoreScreenProps) {
  if (!visible || running) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverCard">
        <div className="gameOverKicker">
          <Trophy size={18} />
          Tổng kết
        </div>
        <h2 className="gameOverTitle">{GAME_TEXT.X2_TITLE}</h2>

        <div className="gameOverScoreBlock">
          <span style={{ fontSize: "16px", color: "#666" }}>
            {GAME_TEXT.X2_META.replace("{score}", (score * 2).toLocaleString("vi-VN"))}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
          <GameButton variant="primary" size="lg" onClick={onWatchAd} style={{ width: "100%" }}>
            <Clapperboard size={18} />
            {GAME_TEXT.ADS_BTN}
          </GameButton>
          <GameButton variant="ghost" size="md" onClick={onSkip} style={{ width: "100%" }}>
            <FastForward size={18} />
            {GAME_TEXT.SKIP_BTN}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
