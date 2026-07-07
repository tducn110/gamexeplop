import { useGameStore } from "@/features/state/useGameStore";
import { useGameSession } from "@/features/state/useGameSession";
import { CountdownOverlay } from "./CountdownOverlay";
import { FloatingTextLayer } from "./FloatingTextLayer";
import { GameOverScreen } from "@/screens/GameOverScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
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
        floors={session.hud.floors}
        combo={session.hud.combo}
        showHints={store.settings.showHints}
        onDashboard={store.openDashboard}
        onSettings={store.openSettings}
        onRestart={session.restartGame}
      />

      <CountdownOverlay countdown={session.countdown} />
      <FloatingTextLayer callout={session.callout} />

      <GameOverScreen
        score={session.hud.score}
        best={session.hud.best}
        floors={session.hud.floors}
        running={session.status === "running"}
        visible={session.status === "gameOver"}
        countdown={session.countdown}
        onRetry={session.restartGame}
      />

      <DashboardScreen
        open={store.dashboardOpen}
        best={session.hud.best}
        lastScore={session.lastScore}
        leaderboard={session.leaderboard}
        onClose={store.closeDashboard}
        onOpenLogin={() => {}}
      />

      <SettingsScreen
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
