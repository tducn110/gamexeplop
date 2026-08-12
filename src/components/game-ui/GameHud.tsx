import { ChartColumnBig, RotateCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "../shared/primitives/IconButton";
import { GameButton } from "../shared/primitives/GameButton";
import { GAME_TEXT } from "@/features/core/gameText";

interface GameHudProps {
  score: number;
  floors: number;
  combo: number;
  showHints: boolean;
  onDashboard: () => void;
  onSettings: () => void;
  onRestart: () => void;
}

export function GameHud({
  score,
  floors,
  combo,
  showHints,
  onDashboard,
  onSettings,
  onRestart,
}: GameHudProps) {
  const [animKey, setAnimKey] = useState(0);
  const [animClass, setAnimClass] = useState("");

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

  return (
    <>
      <div className="gameHud">
        <div className="gameScoreCluster">
          <div key={animKey} className={`gameScore score-text ${animClass}`}>
            {score.toLocaleString("vi-VN")}
          </div>
          <div className="gameScorePills">
            <span className="gameScoreMeta kawaii-pill">Tầng: {floors}</span>
            {combo > 1 && <span className="gameScoreMeta kawaii-pill combo-pill">Combo x{combo}</span>}
          </div>
        </div>

      </div>

      <div className="gameTopLeftActions">
        <IconButton label="Bảng điểm" variant="solid" onClick={onDashboard}>
          <ChartColumnBig size={22} strokeWidth={2.5} />
        </IconButton>
      </div>

      <div className="gameTopRightActions">
        <IconButton label="Cài đặt" variant="solid" onClick={onSettings}>
          <Settings size={22} strokeWidth={2.5} />
        </IconButton>
        <IconButton label="Chơi lại" variant="solid" onClick={onRestart}>
          <RotateCcw size={22} strokeWidth={2.5} />
        </IconButton>
      </div>
    </>
  );
}
