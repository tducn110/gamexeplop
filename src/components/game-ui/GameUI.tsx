import { useEffect, useRef } from "react";
import { useGameStore } from "@/features/state/useGameStore";
import { useGameSession } from "@/features/state/useGameSession";
import { CountdownOverlay } from "./CountdownOverlay";
import { FloatingTextLayer } from "./FloatingTextLayer";
import { GameOverScreen } from "@/screens/GameOverScreen";
import { ReviveScreen } from "@/screens/ReviveScreen";

import { DashboardScreen } from "@/screens/DashboardScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { GameHud } from "./GameHud";

interface GameUIProps {
  session: ReturnType<typeof useGameSession>;
  store: ReturnType<typeof useGameStore>;
  gameControllerRef: React.MutableRefObject<{ revive: () => void } | null>;
}

export function GameUI({ session, store, gameControllerRef }: GameUIProps) {
  const randomizedGameOverKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (session.status !== "gameOver" || randomizedGameOverKeyRef.current === session.sessionKey) return;
    randomizedGameOverKeyRef.current = session.sessionKey;
    store.randomizeCharacter();
  }, [session.sessionKey, session.status, store]);

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

      <ReviveScreen
        floors={session.hud.floors}
        running={session.status === "running"}
        visible={session.status === "revive"}
        onRevive={() => session.confirmRevive(() => gameControllerRef.current?.revive())}
        onSkip={session.skipRevive}
      />

      <GameOverScreen
        score={session.hud.score}
        best={session.hud.best}
        floors={session.hud.floors}
        running={session.status === "running"}
        visible={session.status === "gameOver"}
        countdown={session.countdown}
        character={store.settings.character}
        onRetry={session.restartGame}
        onApplyX2Score={session.applyX2Score}
        canSubmitScore={session.canSubmitScore}
      />

      <DashboardScreen
        open={store.dashboardOpen}
        best={session.hud.best}
        lastScore={session.lastScore}
        leaderboard={(session.leaderboard?.entries || []).map(entry => ({
          rank: entry.rank,
          playerName: entry.displayName || "Anonymous",
          score: entry.score,
          floors: (entry.metadata?.floors as number) || 0,
        } as any))}
        playerName={store.playerName}
        onClose={store.closeDashboard}
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
