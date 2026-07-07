import { Settings as SettingsIcon, Eye, EyeOff, Lightbulb, LightbulbOff, VolumeX, Volume2, Music, Music2 } from "lucide-react";
import { PanelFrame } from "@/components/shared/primitives/PanelFrame";
import { IconButton } from "@/components/shared/primitives/IconButton";

interface SettingsScreenProps {
  open: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  onClose: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

export function SettingsScreen({
  open,
  musicMuted,
  sfxMuted,
  onClose,
  onToggleMusic,
  onToggleSfx,
}: SettingsScreenProps) {
  if (!open) return null;

  return (
    <div className="overlay-scrim" style={{ display: "grid", placeItems: "center", position: "fixed", inset: 0, zIndex: 120, background: "rgba(42,36,24,0.4)" }}>
      <PanelFrame
        title={(
          <span className="settingsPanelTitle">
            <SettingsIcon size={20} />
            Cài đặt
          </span>
        )}
        width={330}
        onClose={onClose}
        className="settingsPanel"
      >
        <div className="settingsPanelRows">
          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              {musicMuted ? <Music size={20} /> : <Music2 size={20} />}
              <span>Nhạc nền</span>
            </div>
            <IconButton
              label={musicMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
              aria-pressed={!musicMuted}
              variant="solid"
              onClick={onToggleMusic}
              className={`settingsToggle ${!musicMuted ? "is-on" : "is-off"}`}
            >
              {!musicMuted ? "Bật" : "Tắt"}
            </IconButton>
          </div>

          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              {sfxMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              <span>Hiệu ứng âm thanh</span>
            </div>
            <IconButton
              label={sfxMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              aria-pressed={!sfxMuted}
              variant="solid"
              onClick={onToggleSfx}
              className={`settingsToggle ${!sfxMuted ? "is-on" : "is-off"}`}
            >
              {!sfxMuted ? "Bật" : "Tắt"}
            </IconButton>
          </div>
        </div>
      </PanelFrame>
    </div>
  );
}
