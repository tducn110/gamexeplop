import { useEffect, useRef, useState } from "react";
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
  const [adPending, setAdPending] = useState(false);
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
        disabled={adPending}
        onRevive={async () => {
          if (adPending) return;
          setAdPending(true);
          // Simulate ad reward
          setTimeout(() => {
            setAdPending(false);
            session.confirmRevive(() => gameControllerRef.current?.revive());
          }, 500);
        }}
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
        adPending={adPending}
        onApplyX2Score={async () => {
          if (adPending) return false;
          setAdPending(true);
          // Simulate ad reward
          return new Promise((resolve) => {
            setTimeout(() => {
              setAdPending(false);
              session.applyX2Score();
              resolve(true);
            }, 500);
          });
        }}
      />

      <DashboardScreen
        open={store.dashboardOpen}
        best={session.hud.best}
        lastScore={session.lastScore}
        leaderboard={[{
          rank: 1,
          playerName: store.playerName || "Player",
          score: session.hud.best,
          floors: session.hud.floors
        }]}
        playerName={store.playerName}
        onClose={store.closeDashboard}
      />

      <SettingsScreen
        open={store.settingsOpen}
        musicMuted={store.settings.musicMuted}
        sfxMuted={store.settings.sfxMuted}
        reducedMotion={store.settings.reducedMotion}
        onClose={store.closeSettings}
        onToggleMusic={() => store.updateSettings({ musicMuted: !store.settings.musicMuted })}
        onToggleSfx={() => store.updateSettings({ sfxMuted: !store.settings.sfxMuted })}
        onToggleMotion={() => store.updateSettings({ reducedMotion: !store.settings.reducedMotion })}
      />
    </>
  );
}
