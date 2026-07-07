import { useState } from "react";
import { loadPlayerName, savePlayerName } from "../backend/authBridge";

export interface GameUiSettings {
  reducedMotion: boolean;
  showHints: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export function useGameStore() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerName, setPlayerNameState] = useState(() => loadPlayerName() || "Nguoi choi");
  const [settings, setSettings] = useState<GameUiSettings>({
    reducedMotion: false,
    showHints: true,
    musicMuted: false,
    sfxMuted: false,
  });

  const openDashboard = () => setDashboardOpen(true);
  const closeDashboard = () => setDashboardOpen(false);
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);
  const persistPlayerName = (name: string) => {
    const safeName = name.trim() || "Nguoi choi";
    savePlayerName(safeName);
    setPlayerNameState(safeName);
  };
  const updateSettings = (patch: Partial<GameUiSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  return {
    dashboardOpen,
    settingsOpen,
    playerName,
    settings,
    openDashboard,
    closeDashboard,
    openSettings,
    closeSettings,
    savePlayerName: persistPlayerName,
    updateSettings,
  };
}
