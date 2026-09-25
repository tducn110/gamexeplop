import { useCallback, useEffect, useRef, useState } from "react";
import { CRASH_CLIMAX_MS } from "../core/constants";
import type { GameStatus } from "../core/types";
import { audioManager } from "../../utils/audio-manager";
import { advanceActiveCountdown } from "./activeCountdown";
import { useWinkIntegration } from "../../integrations/wink/useWinkIntegration";

const RESUME_COUNTDOWN_START = 3;
const RESUME_COUNTDOWN_STEP_MS = 700;

export interface SessionHudState {
  score: number;
  floors: number;
  combo: number;
  best: number;
  bestFloors: number;
}

export function useGameSession(playerName?: string) {
  const wink = useWinkIntegration();
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [hud, setHud] = useState<SessionHudState>(() => {
    let savedBest = 0;
    let savedBestFloors = 0;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedBest = parseInt(window.localStorage.getItem('bestScore') || '0', 10);
        savedBestFloors = parseInt(window.localStorage.getItem('bestFloors') || '0', 10);
      }
    } catch {}
    return {
      score: 0,
      floors: 0,
      combo: 0,
      best: Number.isFinite(savedBest) ? savedBest : 0,
      bestFloors: Number.isFinite(savedBestFloors) ? savedBestFloors : 0,
    };
  });
  const [lastScore, setLastScore] = useState(0);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const [hostPaused, setHostPaused] = useState(false);
  const countdownTimerRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const hasStartedRef = useRef(hasStarted);
  const revivesUsedRef = useRef(revivesUsed);
  const hudRef = useRef(hud);
  const hostPausedRef = useRef(false);
  const gameplayStopCalledRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const pendingScoreRef = useRef<{ score: number } | null>(null);

  useEffect(() => {
    statusRef.current = status;
    hasStartedRef.current = hasStarted;
    revivesUsedRef.current = revivesUsed;
    hudRef.current = hud;
  }, [status, hasStarted, revivesUsed, hud]);

  const setSessionStatus = (nextStatus: GameStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  };

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const startResumeCountdown = (onComplete: () => void) => {
    clearCountdownTimer();
    setSessionStatus("countdown");
    setCountdown(RESUME_COUNTDOWN_START);

    countdownTimerRef.current = window.setInterval(() => {
      if (hostPausedRef.current) return;
      setCountdown((current) => {
        if (current === null) return null;
        if (current <= 1) {
          clearCountdownTimer();
          onComplete();
          return null;
        }
        return current - 1;
      });
    }, RESUME_COUNTDOWN_STEP_MS);
  };

  useEffect(() => {
    if (wink.hostPaused !== hostPaused) {
      setHostPaused(wink.hostPaused);
      hostPausedRef.current = wink.hostPaused;
    }
  }, [wink.hostPaused, hostPaused]);

  const startGame = () => {
    clearCountdownTimer();
    if (gameOverTimerRef.current) window.clearInterval(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    hostPausedRef.current = false;
    gameplayStopCalledRef.current = false;
    submitInFlightRef.current = false;
    pendingScoreRef.current = null;
    setHostPaused(false);
    hudRef.current = { ...hudRef.current, score: 0, floors: 0, combo: 0 };
    setHud((current) => ({ ...current, score: 0, floors: 0, combo: 0 }));
    setSessionStatus("idle");
    setHasStarted(false);
    hasStartedRef.current = false;
    setCountdown(null);
    setSessionKey((current) => current + 1);
    setRevivesUsed(0);
  };

  const restartGame = () => {
    setSessionStatus("idle");
    startGame();
  };

  const pauseGame = () => {
    if (statusRef.current === "running" || statusRef.current === "countdown") {
      clearCountdownTimer();
      setCountdown(null);
      setSessionStatus("paused");
    }
  };

  const resumeGame = () => {
    if (statusRef.current === "idle" || (!hasStartedRef.current && statusRef.current === "paused")) {
      setHasStarted(true);
      hasStartedRef.current = true;
      gameplayStopCalledRef.current = false;
      wink.gameplayStart();
      setSessionStatus("running");
      return;
    }

    if (statusRef.current === "paused") {
      startResumeCountdown(() => {
        setSessionStatus("running");
      });
    }
  };

  const commitHud = (payload: { score: number; floors: number; combo: number }) => {
    hudRef.current = {
      ...hudRef.current,
      score: payload.score,
      floors: payload.floors,
      combo: payload.combo,
    };
    setHud((current) => {
      if (
        current.score === payload.score &&
        current.floors === payload.floors &&
        current.combo === payload.combo
      ) {
        return current;
      }

      return {
        ...current,
        score: payload.score,
        floors: payload.floors,
        combo: payload.combo,
      };
    });
  };

  const handleGameOverEvent = (payload: { score: number; floors: number }) => {
    if (gameOverTimerRef.current) return;
    let crashTimer = { remainingMs: CRASH_CLIMAX_MS, lastTickAt: performance.now() };
    gameOverTimerRef.current = window.setInterval(() => {
      const now = performance.now();
      crashTimer = advanceActiveCountdown(crashTimer, now, hostPausedRef.current);
      if (crashTimer.remainingMs > 0) return;
      window.clearInterval(gameOverTimerRef.current!);
      gameOverTimerRef.current = null;
      if (revivesUsedRef.current < 1) {
        setStatus("revive");
      } else {
        finishGame({ score: hudRef.current.score, floors: hudRef.current.floors });
      }
    }, 50);
  };

  const skipRevive = () => {
    finishGame({ score: hudRef.current.score, floors: hudRef.current.floors });
  };

  const confirmRevive = (reviveCallback: () => void) => {
    setRevivesUsed((current) => current + 1);
    reviveCallback();

    startResumeCountdown(() => {
      setSessionStatus("running");
    });
  };

  const submitScoreSafely = useCallback(
    (targetScore: number) => {
      if (!wink.can("submitScore")) {
        void wink.refreshLeaderboard({ force: true }).catch(() => {});
        return;
      }

      if (submitInFlightRef.current) {
        pendingScoreRef.current = { score: targetScore };
        return;
      }

      submitInFlightRef.current = true;
      void wink
        .submitFinalScore({
          score: targetScore,
          metadata: { floors: hudRef.current.floors },
        })
        .then(async () => {
          if (wink.can("getLeaderboard")) {
            await wink.refreshLeaderboard({ force: true });
          } else {
            await wink.refreshPersonalBest({ force: true });
          }
        })
        .catch((error) => console.warn("[useGameSession] Score submit failed:", error))
        .finally(() => {
          submitInFlightRef.current = false;
          const pending = pendingScoreRef.current;
          if (pending && pending.score > targetScore) {
            pendingScoreRef.current = null;
            submitScoreSafely(pending.score);
          }
        });
    },
    [wink],
  );

  const applyX2Score = () => {
    const doubledScore = hudRef.current.score * 2;
    hudRef.current = {
      ...hudRef.current,
      score: doubledScore,
      best: Math.max(hudRef.current.best, doubledScore),
    };
    setHud((current) => {
      const newBest = Math.max(current.best, doubledScore);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("bestScore", newBest.toString());
        }
      } catch {}
      return { ...current, score: doubledScore, best: newBest };
    });
    setLastScore(doubledScore);
    submitScoreSafely(doubledScore);
  };

  const finishGame = (payload: { score: number; floors: number }) => {
    clearCountdownTimer();
    setCountdown(null);
    setSessionStatus("gameOver");
    setLastScore(payload.score);

    if (!gameplayStopCalledRef.current) {
      gameplayStopCalledRef.current = true;
      wink.gameplayStop();
    }

    submitScoreSafely(payload.score);

    setHud((current) => {
      const newBest = Math.max(current.best, payload.score);
      const newBestFloors = Math.max(current.bestFloors, payload.floors);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("bestScore", newBest.toString());
          window.localStorage.setItem("bestFloors", newBestFloors.toString());
        }
      } catch {}
      return { ...current, score: payload.score, floors: payload.floors, best: newBest, bestFloors: newBestFloors };
    });
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      if (gameOverTimerRef.current) window.clearInterval(gameOverTimerRef.current);
    };
  }, []);

  return {
    status,
    hasStarted,
    countdown,
    hud,
    lastScore,
    sessionKey,
    startGame,
    restartGame,
    pauseGame,
    resumeGame,
    commitHud,
    handleGameOverEvent,
    skipRevive,
    confirmRevive,
    applyX2Score,
    hostPaused,
    wink,
  };
}
