import { useEffect } from "react";
import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";
import { audioManager } from "../utils/audio-manager";

export default function App() {
  useEffect(() => {
    void audioManager.preloadAll("/assets/");
    audioManager.requestBgm(audioManager.landingBgmVolume);

    const handleVisibility = () => {
      audioManager.setVisibilityState(document.visibilityState);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <GameShell>
      <RootRoute />
    </GameShell>
  );
}
