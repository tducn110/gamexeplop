import { useEffect } from "react";
import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";
import { audioManager } from "../utils/audio-manager";

export default function App() {
  useEffect(() => {
    // Preload audio files
    audioManager.preloadAll("/assets/");
    audioManager.tryAutoPlayBgm("/assets/");

    const playButtonClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;

      audioManager.playButtonSfx();
    };

    document.addEventListener("click", playButtonClick, true);
    return () => document.removeEventListener("click", playButtonClick, true);
  }, []);

  return (
    <GameShell>
      <RootRoute />
    </GameShell>
  );
}
