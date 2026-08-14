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
  const store = useGameStore();
  const session = useGameSession(store.playerName);
  const gameControllerRef = useRef<{ revive: () => void } | null>(null);

  useGameSound(store.settings.sfxMuted);

  useEffect(() => {
    audioManager.setMusicMuted(store.settings.musicMuted);
  }, [store.settings.musicMuted]);

  useEffect(() => {
    if (session.status === "running") {
      audioManager.requestBgm(audioManager.gameBgmVolume);
    } else if (session.status === "idle") {
      audioManager.requestBgm(audioManager.landingBgmVolume);
    } else if (session.status === "gameOver" || session.status === "revive") {
      audioManager.requestBgm(0.05);
    }
  }, [session.status]);

  useEffect(() => {
    if (store.settingsOpen || store.dashboardOpen) {
      session.pauseGame();
    }
  }, [store.settingsOpen, store.dashboardOpen]);

  useEffect(() => {
    if (session.sessionKey === 0) {
      session.startGame();
    }
  }, []);

  const handleResumeGame = () => {
    audioManager.requestBgm(audioManager.gameBgmVolume);
    void audioManager.unlockFromGesture().catch((error) => {
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
            onPlacement={session.pushPlacement}
            onResumeGame={handleResumeGame}
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
