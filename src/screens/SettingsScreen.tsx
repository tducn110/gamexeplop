import { Globe, Settings as SettingsIcon, VolumeX, Volume2, Music, Music2, Vibrate, VibrateOff } from "lucide-react";
import { PanelFrame } from "@/components/shared/primitives/PanelFrame";
import { IconButton } from "@/components/shared/primitives/IconButton";
import { useTranslation } from "react-i18next";

interface SettingsScreenProps {
  open: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onToggleMotion: () => void;
}

export function SettingsScreen({
  open,
  musicMuted,
  sfxMuted,
  reducedMotion,
  onClose,
  onToggleMusic,
  onToggleSfx,
  onToggleMotion,
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage?.startsWith("en") ? "en" : "vi";
  const nextLanguage = currentLanguage === "vi" ? "en" : "vi";
  if (!open) return null;

  return (
    <div className="overlay-scrim" style={{ display: "grid", placeItems: "center", position: "fixed", inset: 0, zIndex: 120, background: "rgba(42,36,24,0.4)" }}>
      <PanelFrame
        title={(
          <span className="settingsPanelTitle">
            <SettingsIcon size={20} />
            {t("SETTINGS")}
          </span>
        )}
        width={330}
        onClose={onClose}
        className="settingsPanel"
      >
        <div className="settingsPanelRows">
          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              <Globe size={20} />
              <span>{t("LANGUAGE")}</span>
            </div>
            <IconButton
              label={currentLanguage === "vi" ? "Tiếng Việt" : "English"}
              aria-label={currentLanguage === "vi" ? "Tiếng Việt" : "English"}
              variant="solid"
              onClick={() => void i18n.changeLanguage(nextLanguage)}
              className="settingsToggle is-on"
            >
              {currentLanguage.toUpperCase()}
            </IconButton>
          </div>
          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              {musicMuted ? <Music size={20} /> : <Music2 size={20} />}
              <span>{t("MUSIC")}</span>
            </div>
            <IconButton
              label={musicMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
              aria-pressed={!musicMuted}
              variant="solid"
              onClick={onToggleMusic}
              className={`settingsToggle ${!musicMuted ? "is-on" : "is-off"}`}
              style={{ fontWeight: "bold", color: !musicMuted ? "white" : "black" }}
            >
              {!musicMuted ? t("ON") : t("OFF")}
            </IconButton>
          </div>

          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              {sfxMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              <span>{t("SFX")}</span>
            </div>
            <IconButton
              label={sfxMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              aria-pressed={!sfxMuted}
              variant="solid"
              onClick={onToggleSfx}
              className={`settingsToggle ${!sfxMuted ? "is-on" : "is-off"}`}
              style={{ fontWeight: "bold", color: !sfxMuted ? "white" : "black" }}
            >
              {!sfxMuted ? t("ON") : t("OFF")}
            </IconButton>
          </div>

          <div className="settingsOptionRow">
            <div className="settingsOptionLabel">
              {reducedMotion ? <VibrateOff size={20} /> : <Vibrate size={20} />}
              <span>{t("REDUCED MOTION")}</span>
            </div>
            <IconButton
              label={reducedMotion ? "Bật rung" : "Tắt rung"}
              aria-pressed={!reducedMotion}
              variant="solid"
              onClick={onToggleMotion}
              className={`settingsToggle ${!reducedMotion ? "is-on" : "is-off"}`}
              style={{ fontWeight: "bold", color: !reducedMotion ? "white" : "black" }}
            >
              {!reducedMotion ? t("ON") : t("OFF")}
            </IconButton>
          </div>
        </div>
      </PanelFrame>
    </div>
  );
}
