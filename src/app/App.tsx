import { useEffect } from "react";
import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";
import { audioManager } from "../utils/audio-manager";
import { preloadCriticalResources, preloadNonCriticalResources } from "../utils/game-loader";
import { completeGameLoading, onGameLoadingDismiss, setGameLoadingProgress } from "../utils/loading-controller";
import { resolveGlobalWink, useWinkIntegration } from "../integrations/wink/useWinkIntegration";


export default function App() {
  const wink = useWinkIntegration();

  useEffect(() => {
    audioManager.setParentMuted(wink.parentMuted);
    audioManager.setHostPaused(wink.hostPaused);
  }, [wink.parentMuted, wink.hostPaused]);

  // Unified PapaStudio loading screen lifecycle barrier
  useEffect(() => {
    setGameLoadingProgress(25);
    const criticalPromise = preloadCriticalResources((pct) => {
      setGameLoadingProgress(Math.min(95, pct));
    });
    const winkPromise = resolveGlobalWink();
    void Promise.allSettled([criticalPromise, winkPromise]).then(() => {
      completeGameLoading();
    });
    const unbind = onGameLoadingDismiss(() => {
      preloadNonCriticalResources();
    });
    return unbind;
  }, []);

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