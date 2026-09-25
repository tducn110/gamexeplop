import { useEffect } from "react";
import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";
import { audioManager } from "../utils/audio-manager";
import { preloadCriticalResources, preloadNonCriticalResources } from "../utils/game-loader";
import { completeGameLoading, onGameLoadingDismiss, setGameLoadingProgress } from "../utils/loading-controller";
import { resolveGlobalWink, useWinkIntegration, WinkProvider } from "../integrations/wink/useWinkIntegration";

function GameApp() {
  const wink = useWinkIntegration();

  useEffect(() => {
    const blockCopyAction = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("copy", blockCopyAction, true);
    document.addEventListener("cut", blockCopyAction, true);
    document.addEventListener("selectstart", blockCopyAction, true);
    document.addEventListener("dragstart", blockCopyAction, true);
    document.addEventListener("contextmenu", blockCopyAction, true);

    return () => {
      document.removeEventListener("copy", blockCopyAction, true);
      document.removeEventListener("cut", blockCopyAction, true);
      document.removeEventListener("selectstart", blockCopyAction, true);
      document.removeEventListener("dragstart", blockCopyAction, true);
      document.removeEventListener("contextmenu", blockCopyAction, true);
    };
  }, []);

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

export default function App() {
  return (
    <WinkProvider>
      <GameApp />
    </WinkProvider>
  );
}