import { ChartColumnBig, Settings, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "../ui/primitives/IconButton";
import { GameButton } from "../ui/primitives/GameButton";
import { GAME_TEXT } from "@/features/game/core/gameText";

interface GameHudProps {
  score: number;
  best: number;
  floors: number;
  combo: number;
  playerName: string;
  showHints: boolean;
  onDashboard: () => void;
  onSettings: () => void;
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
      <nav className="gameTopBar">
        <div className="loginPromptBtn gameTopIdentity">
          <div className="gameAvatar">
            <UserRound size={28} />
          </div>
          <div className="gameIdentityCopy">
            <span className="brandName gamePlayerName">{playerName}</span>
            <span className="gamePlayerMeta">
              {GAME_TEXT.FLOORS_LABEL.replace("{floors}", floors.toString()).replace("{best}", best.toString())}
            </span>
          </div>
        </div>

        <div className="gameActions">
          <IconButton label="Bảng điểm" onClick={onDashboard} style={{ width: 44, height: 44 }}>
            <ChartColumnBig size={28} />
          </IconButton>
          <IconButton label="Cài đặt" onClick={onSettings} style={{ width: 44, height: 44 }}>
            <Settings size={28} />
          </IconButton>
        </div>
      </nav>

      <div className="gameHud">
        <div key={animKey} className={`gameScore score-text ${animClass}`}>
          {score}
        </div>
        <div className="gameLives">
          {showHints && floors === 0 ? <span className="gameHint">{GAME_TEXT.TAP_TO_DROP}</span> : null}
        </div>
      </div>

      <div className="gameRestart">
        <GameButton variant="secondary" size="md" onClick={onRestart}>
          {GAME_TEXT.NEW_GAME}
        </GameButton>
      </div>
    </>
  );
}
