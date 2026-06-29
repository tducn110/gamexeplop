import { GameButton } from "../ui/primitives/GameButton";
import { PanelFrame } from "../ui/primitives/PanelFrame";

interface SettingsPanelProps {
  open: boolean;
  reducedMotion: boolean;
  showHints: boolean;
  onClose: () => void;
  onToggleReducedMotion: () => void;
  onToggleHints: () => void;
}

export function SettingsPanel({
  open,
  reducedMotion,
  showHints,
  onClose,
  onToggleReducedMotion,
  onToggleHints,
}: SettingsPanelProps) {
  if (!open) return null;
  return (
    <div className="overlay-scrim">
      <PanelFrame className="side-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Cai dat</p>
            <h2 className="panel-title">Tuy chinh choi game</h2>
          </div>
          <GameButton variant="ghost" size="sm" onClick={onClose}>
            Dong
          </GameButton>
        </div>

        <div className="setting-row">
          <div>
            <strong>Reduced motion</strong>
            <p>Giam rung va nhan manh chuyen dong.</p>
          </div>
          <GameButton variant={reducedMotion ? "primary" : "secondary"} size="sm" onClick={onToggleReducedMotion}>
            {reducedMotion ? "Bat" : "Tat"}
          </GameButton>
        </div>

        <div className="setting-row">
          <div>
            <strong>Huong dan nhanh</strong>
            <p>Hien nhac nho thao tac tren HUD.</p>
          </div>
          <GameButton variant={showHints ? "primary" : "secondary"} size="sm" onClick={onToggleHints}>
            {showHints ? "Bat" : "Tat"}
          </GameButton>
        </div>
      </PanelFrame>
    </div>
  );
}
