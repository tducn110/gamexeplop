import { lazy, Suspense } from "react";
import { useGameSession } from "@/features/game/state/useGameSession";
import { useGameStore } from "@/features/game/state/useGameStore";
import { CountdownOverlay } from "@/components/game-ui/CountdownOverlay";
import { DashboardPanel } from "@/components/game-ui/DashboardPanel";
import { FloatingTextLayer } from "@/components/game-ui/FloatingTextLayer";
import { GameHud } from "@/components/game-ui/GameHud";
import { GameOverOverlay } from "@/components/game-ui/GameOverOverlay";
import { LoginModal } from "@/components/game-ui/LoginModal";
import { SettingsPanel } from "@/components/game-ui/SettingsPanel";
import { GameButton } from "@/components/ui/primitives/GameButton";

const PixiGameStage = lazy(async () => {
  const module = await import("@/features/game/render/pixi/PixiGameStage");
  return { default: module.PixiGameStage };
});

export function RootRoute() {
  const store = useGameStore();
  const session = useGameSession(store.playerName);

  return (
    <div className="game-page">
      <div className="game-frame">
        <Suspense fallback={<div className="stage-loading">Dang tai san choi...</div>}>
          <PixiGameStage
            sessionKey={session.sessionKey}
            status={session.status}
            onScoreChange={session.commitHud}
            onGameOver={session.finishGame}
            onPlacement={session.pushPlacement}
          />
        </Suspense>

        <GameHud
          score={session.hud.score}
          best={session.hud.best}
          floors={session.hud.floors}
          combo={session.hud.combo}
          playerName={store.playerName}
          showHints={store.settings.showHints}
          onDashboard={store.openDashboard}
          onSettings={store.openSettings}
          onLogin={store.openLogin}
          onRestart={session.restartGame}
        />

        {session.status === "idle" ? (
          <div className="start-overlay">
            <div className="start-copy">
              <p className="eyebrow">Chong Rom Len May</p>
              <h1>Xep cao, canh chuan, giu nhịp thap rom.</h1>
              <p>Tap vao san choi de tha bo rom dang di ngang. Cat cang it, thap cang ben.</p>
            </div>
            <div className="start-actions">
              <GameButton size="lg" onClick={session.startGame}>
                Bat dau choi
              </GameButton>
              <GameButton variant="secondary" size="md" onClick={store.openDashboard}>
                Xem bang diem
              </GameButton>
            </div>
          </div>
        ) : null}

        <CountdownOverlay countdown={session.countdown} />
        <FloatingTextLayer callout={session.callout} />

        {session.status === "gameOver" ? (
          <GameOverOverlay
            score={session.hud.score}
            floors={session.hud.floors}
            best={session.hud.best}
            onReplay={session.restartGame}
          />
        ) : null}
      </div>

      <DashboardPanel
        open={store.dashboardOpen}
        best={session.hud.best}
        lastScore={session.lastScore}
        leaderboard={session.leaderboard}
        onClose={store.closeDashboard}
        onOpenLogin={store.openLogin}
      />

      <SettingsPanel
        open={store.settingsOpen}
        reducedMotion={store.settings.reducedMotion}
        showHints={store.settings.showHints}
        onClose={store.closeSettings}
        onToggleReducedMotion={() => store.updateSettings({ reducedMotion: !store.settings.reducedMotion })}
        onToggleHints={() => store.updateSettings({ showHints: !store.settings.showHints })}
      />

      <LoginModal
        open={store.loginOpen}
        currentName={store.playerName}
        onClose={store.closeLogin}
        onSave={store.savePlayerName}
      />
    </div>
  );
}
