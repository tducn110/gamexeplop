import { useEffect } from "react";
import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";
import { audioManager } from "../utils/audio-manager";

export default function App() {
  useEffect(() => {
    let bootstrapped = false;
    void audioManager.preloadAll("/assets/");
    audioManager.requestBgm(audioManager.landingBgmVolume);

    const unlockFromFirstGesture = () => {
      if (bootstrapped) return;
      bootstrapped = true;

      void audioManager.unlockFromGesture().catch((error) => {
        console.warn("Audio unlock failed", error);
      });

      document.removeEventListener("pointerdown", unlockFromFirstGesture, true);
      document.removeEventListener("touchstart", unlockFromFirstGesture, true);
      document.removeEventListener("keydown", unlockFromFirstGesture, true);
    };

    const handleVisibility = () => {
      audioManager.setVisibilityState(document.visibilityState);
    };

    const playButtonClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;

      audioManager.playButtonSfx();
    };

    document.addEventListener("pointerdown", unlockFromFirstGesture, true);
    document.addEventListener("touchstart", unlockFromFirstGesture, true);
    document.addEventListener("keydown", unlockFromFirstGesture, true);
    document.addEventListener("click", playButtonClick, true);
    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener("pointerdown", unlockFromFirstGesture, true);
      document.removeEventListener("touchstart", unlockFromFirstGesture, true);
      document.removeEventListener("keydown", unlockFromFirstGesture, true);
      document.removeEventListener("click", playButtonClick, true);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <GameShell>
      <RootRoute />
    </GameShell>
  );
}
