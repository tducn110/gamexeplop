import { useGameStore } from "@/features/game/state/useGameStore";
import { useGameSession } from "@/features/game/state/useGameSession";
import { CountdownOverlay } from "./CountdownOverlay";
import { FloatingTextLayer } from "./FloatingTextLayer";
import { GameOverOverlay } from "./GameOverOverlay";
import { DashboardPanel } from "./DashboardPanel";
import { SettingsPanel } from "./SettingsPanel";
import { GameHud } from "./GameHud";

interface GameUIProps {
  session: ReturnType<typeof useGameSession>;
  store: ReturnType<typeof useGameStore>;
  gameControllerRef: React.MutableRefObject<{ revive: () => void } | null>;
}

export function GameUI({ session, store, gameControllerRef }: GameUIProps) {
  return (
    <>
      <GameHud
        score={session.hud.score}
        best={session.hud.best}
        floors={session.hud.floors}
        combo={session.hud.combo}
        playerName={store.playerName}
        showHints={store.settings.showHints}
        onDashboard={store.openDashboard}
        onSettings={store.openSettings}
        onRestart={session.restartGame}
      />

      <CountdownOverlay countdown={session.countdown} />
      <FloatingTextLayer callout={session.callout} />

      <GameOverOverlay
        finalScore={session.hud.score}
        displayScore={session.hud.score}
        running={session.status === "running"}
        visible={["revive", "x2score", "gameOver"].includes(session.status)}
        countdown={session.countdown}
        mode={session.status === "revive" ? "continue" : "summary"}
        canContinue={session.status === "revive"}
        canDoubleScore={session.status === "x2score"}
        onContinue={() => session.confirmRevive(() => gameControllerRef.current?.revive())}
        onDeclineContinue={session.skipRevive}
        onDoubleScore={() => {
          session.applyX2Score();
          // After double score, it goes to "gameOver" state, where they can see the doubled score and click "Kết thúc"
        }}
        onEndGame={() => {
          if (session.status === "x2score") {
            session.skipX2Score();
            session.restartGame();
            store.openDashboard();
          } else {
            session.restartGame();
            store.openDashboard();
          }
        }}
      />

      <DashboardPanel
        open={store.dashboardOpen}
        best={session.hud.best}
        lastScore={session.lastScore}
        leaderboard={session.leaderboard}
        onClose={store.closeDashboard}
        onOpenLogin={() => {}}
      />

      <SettingsPanel
        open={store.settingsOpen}
        musicMuted={store.settings.musicMuted}
        sfxMuted={store.settings.sfxMuted}
        onClose={store.closeSettings}
        onToggleMusic={() => store.updateSettings({ musicMuted: !store.settings.musicMuted })}
        onToggleSfx={() => store.updateSettings({ sfxMuted: !store.settings.sfxMuted })}
      />
    </>
  );
}
