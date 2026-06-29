import { useState } from "react";
import { loadPlayerName, savePlayerName } from "../backend/authBridge";

export interface GameUiSettings {
  reducedMotion: boolean;
  showHints: boolean;
}

export function useGameStore() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [playerName, setPlayerNameState] = useState(() => loadPlayerName() || "Nguoi choi");
  const [settings, setSettings] = useState<GameUiSettings>({
    reducedMotion: false,
    showHints: true,
  });

  const openDashboard = () => setDashboardOpen(true);
  const closeDashboard = () => setDashboardOpen(false);
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);
  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);
  const persistPlayerName = (name: string) => {
    const safeName = name.trim() || "Nguoi choi";
    savePlayerName(safeName);
    setPlayerNameState(safeName);
    setLoginOpen(false);
  };
  const updateSettings = (patch: Partial<GameUiSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  return {
    dashboardOpen,
    settingsOpen,
    loginOpen,
    playerName,
    settings,
    openDashboard,
    closeDashboard,
    openSettings,
    closeSettings,
    openLogin,
    closeLogin,
    savePlayerName: persistPlayerName,
    updateSettings,
  };
}
