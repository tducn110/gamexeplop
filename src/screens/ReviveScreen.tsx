import { FastForward, HeartPulse, Clapperboard } from "lucide-react";
import { GameButton } from "@/components/shared/primitives/GameButton";
import { useTranslation } from "react-i18next";

interface ReviveScreenProps {
  floors: number;
  running: boolean;
  visible: boolean;
  disabled?: boolean;
  onRevive: () => void;
  onSkip: () => void;
}

export function ReviveScreen({
  running,
  visible,
  disabled = false,
  onRevive,
  onSkip,
}: ReviveScreenProps) {
  const { t } = useTranslation();
  if (!visible || running) return null;

  return (
    <div className="gameOverOverlay">
      <div className="gameOverCard" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <div style={{ marginBottom: "32px", color: "#f97316", display: "flex", justifyContent: "center" }}>
          <HeartPulse size={80} strokeWidth={1.5} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <GameButton variant="primary" size="lg" onClick={onRevive} disabled={disabled} style={{ width: "100%", height: "56px", fontSize: "1.1rem" }}>
            <Clapperboard size={24} />
            {t("RESUME")}
          </GameButton>
          <GameButton variant="ghost" size="md" onClick={onSkip} disabled={disabled} style={{ width: "100%", height: "48px" }}>
            <FastForward size={20} />
            {t("NO THANKS")}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
