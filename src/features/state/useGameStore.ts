import { useState } from "react";
import { loadPlayerName, savePlayerName } from "../backend/authBridge";
import { DEFAULT_CHARACTER_ASSET, pickRandomCharacterAsset, type CharacterAsset } from "../characters/characterAssets";

export interface GameUiSettings {
  reducedMotion: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  character: CharacterAsset;
}

export function useGameStore() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerName, setPlayerNameState] = useState(() => loadPlayerName() || "Nguoi choi");
  const [settings, setSettings] = useState<GameUiSettings>({
    reducedMotion: false,
    musicMuted: false,
    sfxMuted: false,
    character: pickRandomCharacterAsset(DEFAULT_CHARACTER_ASSET.id),
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
  const randomizeCharacter = () => {
    setSettings((current) => ({
      ...current,
      character: pickRandomCharacterAsset(current.character.id),
    }));
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
    randomizeCharacter,
  };
}
