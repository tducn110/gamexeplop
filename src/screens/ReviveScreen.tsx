import { HeartPulse, FastForward, Trophy, Video } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";
import { GAME_TEXT } from "@/features/core/gameText";

interface ReviveScreenProps {
  floors: number;
  running: boolean;
  visible: boolean;
  onRevive: () => void;
  onSkip: () => void;
}

export function ReviveScreen({
  floors,
  running,
  visible,
  onRevive,
  onSkip,
}: ReviveScreenProps) {
  if (!visible || running) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverCard">
        <div className="gameOverKicker">
          <Trophy size={18} />
          Chim trời đã chặn đường
        </div>
        <h2 className="gameOverTitle">{GAME_TEXT.REVIVE_TITLE}</h2>

        <div className="gameOverScoreBlock">
          <span style={{ fontSize: "15px", color: "#666", lineHeight: 1.4, padding: "0 10px", whiteSpace: "pre-wrap" }}>
            {GAME_TEXT.REVIVE_META.replace("{floors}", floors.toString())}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
          <GameButton variant="primary" size="lg" onClick={onRevive} style={{ width: "100%" }}>
            <Video size={18} />
            {GAME_TEXT.REVIVE_BTN}
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
