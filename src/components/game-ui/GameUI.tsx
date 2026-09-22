import { useEffect, useRef } from "react";
import { useGameStore } from "@/features/state/useGameStore";
import { useGameSession } from "@/features/state/useGameSession";
import { CountdownOverlay } from "./CountdownOverlay";
import { GameOverScreen } from "@/screens/GameOverScreen";
import { ReviveScreen } from "@/screens/ReviveScreen";

import { DashboardScreen } from "@/screens/DashboardScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { GameHud } from "./GameHud";
import type { WinkLeaderboardEntry } from "@/integrations/wink/types";
import i18n from "@/i18n";

interface GameUIProps {
  session: ReturnType<typeof useGameSession>;
  store: ReturnType<typeof useGameStore>;
  gameControllerRef: React.MutableRefObject<{ revive: () => void } | null>;
}

export function GameUI({ session, store, gameControllerRef }: GameUIProps) {
  const randomizedGameOverKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (!store.dashboardOpen || session.wink.status === "standalone") return;
    void session.wink.refreshLeaderboard().catch(() => {});
  }, [session.wink.refreshLeaderboard, session.wink.status, store.dashboardOpen]);

  useEffect(() => {
    if (session.status !== "gameOver" || randomizedGameOverKeyRef.current === session.sessionKey) return;
    randomizedGameOverKeyRef.current = session.sessionKey;
    store.randomizeCharacter();
  }, [session.sessionKey, session.status, store]);

  const remoteLeaderboard = session.wink.leaderboard.slice(0, 10).map(
    (entry: WinkLeaderboardEntry) => ({
      rank: entry.rank,
      playerName:
        entry.displayName ||
        i18n.t("PLAYER"),
      score: entry.score,
      floors: (entry as any).floors ?? null,
    }),
  );
  const leaderboard = remoteLeaderboard;
  const dashboardBest =
    session.wink.status === "standalone"
      ? session.hud.best
      : (session.wink.bestScore || session.hud.best);
  const dashboardPlayerName = session.wink.displayName || store.playerName || "";

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

      <ReviveScreen
        floors={session.hud.floors}
        running={session.status === "running"}
        visible={session.status === "revive"}
        onRevive={() => {
          session.confirmRevive(() => gameControllerRef.current?.revive());
        }}
        onSkip={session.skipRevive}
      />

      <GameOverScreen
        score={session.hud.score}
        best={dashboardBest}
        floors={session.hud.floors}
        running={session.status === "running"}
        visible={session.status === "gameOver"}
        countdown={session.countdown}
        character={store.settings.character}
        onRetry={session.restartGame}
        onApplyX2Score={async () => {
          session.applyX2Score();
          return true;
        }}
      />

      <DashboardScreen
        open={store.dashboardOpen}
        best={dashboardBest}
        bestFloors={session.hud.bestFloors}
        personalBestRank={session.wink.personalBest?.rank ?? null}
        lastScore={session.lastScore}
        leaderboard={leaderboard}
        playerName={dashboardPlayerName}
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
