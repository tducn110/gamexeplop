import { ChartColumnBig, RotateCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "../shared/primitives/IconButton";
import { useTranslation } from "react-i18next";

interface GameHudProps {
  score: number;
  floors: number;
  combo: number;
  onDashboard: () => void;
  onSettings: () => void;
  onRestart: () => void;
}

export function GameHud({
  score,
  floors,
  combo,
  onDashboard,
  onSettings,
  onRestart,
}: GameHudProps) {
  const [animKey, setAnimKey] = useState(0);
  const [animClass, setAnimClass] = useState("");
  const [comboAnimKey, setComboAnimKey] = useState(0);
  const [comboAnimClass, setComboAnimClass] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (score > 0) {
      setAnimKey(prev => prev + 1);
      if (combo >= 4) {
        setAnimClass("score-animate-shake-heavy");
      } else if (combo >= 2) {
        setAnimClass("score-animate-shake");
      } else {
        setAnimClass("score-animate-bump");
      }
    }
  }, [score, combo]);

  useEffect(() => {
    if (combo > 1) {
      setComboAnimKey((prev) => prev + 1);
      setComboAnimClass(combo >= 4 ? "combo-animate-pop combo-animate-pop-heavy" : "combo-animate-pop");
      return;
    }

    setComboAnimClass("");
  }, [combo]);

  return (
    <>
      <div className="gameHud">
        <div className="gameScoreCluster">
          <div key={animKey} className={`gameScore score-text ${animClass}`}>
            {score.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US")}
          </div>
          <div className="gameScorePills">
            <span className="gameScoreMeta kawaii-pill">{t("FLOORS")}: {floors}</span>
            {combo > 1 && (
              <span key={comboAnimKey} className={`gameScoreMeta kawaii-pill combo-pill ${comboAnimClass}`}>
                {t("COMBO_X", { count: combo })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="gameTopLeftActions" style={{ display: 'flex', gap: '8px' }}>
        <IconButton label={t("LEADERBOARD")} variant="solid" onClick={onDashboard}>
          <ChartColumnBig size={22} strokeWidth={2.5} />
        </IconButton>
      </div>

      <div className="gameTopRightActions" style={{ display: 'flex', gap: '8px' }}>
        <IconButton label={t("SETTINGS")} variant="solid" onClick={onSettings}>
          <Settings size={22} strokeWidth={2.5} />
        </IconButton>
        <IconButton label={t("RETRY")} variant="solid" onClick={onRestart}>
          <RotateCcw size={22} strokeWidth={2.5} />
        </IconButton>
      </div>
    </>
  );
}
