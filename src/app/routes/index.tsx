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

  useEffect(() => {
    if (session.status === "running") {
      audioManager.requestBgm(audioManager.gameBgmVolume);
    } else if (session.status === "idle" || session.status === "paused") {
      audioManager.requestBgm(audioManager.landingBgmVolume);
    } else if (session.status === "gameOver" || session.status === "revive") {
      audioManager.requestBgm(0.05);
    }
  }, [session.status]);

  const blockingOverlayOpen = store.settingsOpen || store.dashboardOpen;

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
    // ponytail: global pointerdown capture already plays button sfx for .start-ready
    audioManager.requestBgm(audioManager.gameBgmVolume);
    void audioManager.unlockAudio().catch((error) => {
      console.warn("Audio unlock failed", error);
    });
    session.resumeGame();
  };

  return (
    <div className="game-page">
      <div className="game-frame">
        <Suspense fallback={<div className="stage-loading">Đang tải sân chơi...</div>}>
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
