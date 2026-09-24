import { useTranslation } from "react-i18next";
import { lazy, Suspense, useRef, useEffect } from "react";
import { useGameSession } from "@/features/state/useGameSession";
import { useGameStore } from "@/features/state/useGameStore";
import { GameUI } from "@/components/game-ui/GameUI";
import { useGameSound } from "@/hooks/useSound";
import { audioManager } from "@/utils/audio-manager";

const PixiGameStage = lazy(async () => {
  const module = await import("@/features/render/pixi/PixiGameStage");
  return { default: module.PixiGameStage };
});

export function RootRoute() {
  const { t } = useTranslation();
  const store = useGameStore();
  const session = useGameSession(store.playerName);
  const gameControllerRef = useRef<{ revive: () => void } | null>(null);
  const overlayWasOpenRef = useRef(false);
  const resumeAfterOverlayRef = useRef(false);

  useGameSound(store.settings.sfxMuted);

  useEffect(() => {
    audioManager.setMusicMuted(store.settings.musicMuted);
  }, [store.settings.musicMuted]);

  const sessionStatusRef = useRef(session.status);
  useEffect(() => {
    sessionStatusRef.current = session.status;
  }, [session.status]);

  const blockingOverlayOpen = store.settingsOpen || store.dashboardOpen;

  useEffect(() => {
    if (blockingOverlayOpen || session.status === "paused") {
      // Khi bật menu để pause thì tắt âm thanh nhạc nền
      audioManager.pauseBgm();
    } else if (session.status === "running") {
      audioManager.requestBgm(audioManager.gameBgmVolume);
    } else if (session.status === "idle") {
      if (session.hasStarted) {
        audioManager.requestBgm(audioManager.landingBgmVolume);
      } else {
        // Not started yet: do not play BGM before user touches "Tap to start"
        audioManager.pauseBgm();
      }
    } else if (session.status === "gameOver" || session.status === "revive") {
      audioManager.requestBgm(0.05);
    }
  }, [session.status, session.hasStarted, blockingOverlayOpen]);

  // Mechanism: Mất focus (blur / tab ẩn) -> pause toàn bộ game và tự động mở Settings panel
  useEffect(() => {
    const handleLoseFocus = () => {
      const currentStatus = sessionStatusRef.current;
      if (currentStatus === "running" || currentStatus === "countdown") {
        resumeAfterOverlayRef.current = true;
        session.pauseGame();
        store.openSettings();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLoseFocus();
      }
    };

    window.addEventListener("blur", handleLoseFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleLoseFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, store]);

  useEffect(() => {
    if (blockingOverlayOpen) {
      if (
        !overlayWasOpenRef.current &&
        (session.status === "running" || session.status === "countdown")
      ) {
        resumeAfterOverlayRef.current = true;
      }
      session.pauseGame();
    } else if (overlayWasOpenRef.current && resumeAfterOverlayRef.current) {
      resumeAfterOverlayRef.current = false;
      session.resumeGame();
    }

    overlayWasOpenRef.current = blockingOverlayOpen;
  }, [blockingOverlayOpen, session.status]);

  useEffect(() => {
    if (session.sessionKey === 0) {
      session.startGame();
    }
  }, []);

  const handleResumeGame = () => {
    // Bật âm thanh ngay khi người dùng chạm "Chạm để bắt đầu"
    void audioManager.unlockAudio().catch((error) => {
      console.warn("Audio unlock failed", error);
    });
    audioManager.requestBgm(audioManager.gameBgmVolume);
    session.resumeGame();
  };

  return (
    <div className="game-page">
      <div className="game-frame">
        <Suspense fallback={<div className="stage-loading">{t("STAGE_LOADING")}</div>}>
          <PixiGameStage
            sessionKey={session.sessionKey}
            status={session.status}
            onScoreChange={session.commitHud}
            onGameOver={session.handleGameOverEvent}
            onResumeGame={handleResumeGame}
            rendererPaused={session.hostPaused}
            hostPaused={session.hostPaused}
            showStartPrompt={!session.hasStarted}
            gameControllerRef={gameControllerRef}
            reducedMotion={store.settings.reducedMotion}
          />
        </Suspense>

        <GameUI session={session} store={store} gameControllerRef={gameControllerRef} />
      </div>
    </div>
  );
}
