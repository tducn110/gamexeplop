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
      <nav className="gameTopBar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px",
        background: "rgba(245,236,215,0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(138,125,101,0.18)",
        fontFamily: "var(--font-family)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }} className="loginPromptBtn">
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #f8c860, #d99820)",
            border: "2px solid #2a2418",
            display: "grid", placeItems: "center",
            color: "#2a2418", fontWeight: 800,
          }}>
            <UserRound size={28} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="brandName" style={{ fontWeight: 800, color: "#2a2418", letterSpacing: 0.3, fontSize: 18 }}>
              {playerName}
            </span>
            <span style={{ fontSize: 13, color: "var(--pencil-gray)", fontWeight: 600 }}>{GAME_TEXT.FLOORS_LABEL.replace("{floors}", floors.toString()).replace("{best}", best.toString())}</span>
          </div>
        </div>

        <div className="gameActions" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <IconButton label="Bảng điểm" onClick={onDashboard} style={{ width: 44, height: 44 }}>
            <ChartColumnBig size={28} />
          </IconButton>
          <IconButton label="Cài đặt" onClick={onSettings} style={{ width: 44, height: 44 }}>
            <Settings size={28} />
          </IconButton>
        </div>
      </nav>

      <div className="gameHud" style={{ color: "#ffffff", justifyContent: "center" }}>
        <div key={animKey} className={`score-text ${animClass}`} style={{ 
          fontSize: "4rem", 
          fontWeight: 900, 
          textShadow: "0 4px 12px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.3)" 
        }}>
          {score}
        </div>
        <div className="gameLives" style={{ position: "absolute", top: 80 }}>
           {showHints && floors === 0 ? <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>{GAME_TEXT.TAP_TO_DROP}</span> : null}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 100 }}>
        <GameButton variant="secondary" size="md" onClick={onRestart}>
          {GAME_TEXT.NEW_GAME}
        </GameButton>
      </div>
    </>
  );
}
