import { useState, useEffect } from "react";
import { RotateCcw, Video } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";
import type { CharacterAsset } from "@/features/characters/characterAssets";
import { useTranslation } from "react-i18next";

interface GameOverScreenProps {
  score: number;
  best: number;
  floors: number;
  running: boolean;
  visible: boolean;
  countdown: number | null;
  character: CharacterAsset;
  onRetry: () => void;
  adPending?: boolean;
  onApplyX2Score: () => Promise<boolean>;
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
  adPending = false,
  onApplyX2Score,
}: GameOverScreenProps) {
  const [adWatched, setAdWatched] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (visible) {
      setAdWatched(false);
    }
  }, [visible]);

  if (!visible || running || countdown !== null) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverPresentation">
        <img className="gameOverCharacter" src={character.src} alt="" aria-hidden="true" />
        <div className="gameOverCard">
          <h2 className="gameOverTitle">{t("GAME OVER")}</h2>

          <div className="gameOverScoreBlock">
            <span>{t("SCORE")}</span>
            <strong>{score.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US")}</strong>
          </div>

          <div className="gameOverStats">
            <div>
              <span>{t("FLOORS")}</span>
              <strong>{floors}</strong>
            </div>
            <div>
              <span>{t("BEST")}</span>
              <strong>{best.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US")}</strong>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            {!adWatched && (
              <GameButton
                variant="warning"
                size="lg"
                disabled={adPending}
                onClick={async () => {
                  if (await onApplyX2Score()) setAdWatched(true);
                }}
                style={{ width: "100%" }}
              >
                <Video size={18} />
                {t("X2 SCORE")}
              </GameButton>
            )}
            <GameButton variant="primary" size="lg" onClick={onRetry} disabled={adPending} style={{ width: "100%" }}>
              <RotateCcw size={18} />
              {t("RETRY")}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
}
