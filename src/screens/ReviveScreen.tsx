import { FastForward, HeartPulse, Clapperboard } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";

interface ReviveScreenProps {
  floors: number;
  running: boolean;
  visible: boolean;
  onRevive: () => void;
  onSkip: () => void;
}

export function ReviveScreen({
  running,
  visible,
  onRevive,
  onSkip,
}: ReviveScreenProps) {
  if (!visible || running) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverCard" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Biểu tượng Hồi sinh / Thua cuộc */}
        <div style={{ marginBottom: "32px", color: "#f97316", display: "flex", justifyContent: "center" }}>
          <HeartPulse size={80} strokeWidth={1.5} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <GameButton variant="primary" size="lg" onClick={onRevive} style={{ width: "100%", height: "56px", fontSize: "1.1rem" }}>
            <Clapperboard size={24} />
            Tiếp tục
          </GameButton>
          <GameButton variant="ghost" size="md" onClick={onSkip} style={{ width: "100%", height: "48px" }}>
            <FastForward size={20} />
            Bỏ qua
          </GameButton>
        </div>
      </div>
    </div>
  );
}
