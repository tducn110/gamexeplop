import { useEffect, useRef, useState, useCallback } from "react";
import { getBestScore } from "../backend/scoreApi";
import { CRASH_CLIMAX_MS } from "../core/constants";
import type { GameStatus } from "../core/types";
import { winkGame, type WinkRound } from "../../integrations/wink/client";
import type { LeaderboardResponse, WinkBridgeState } from "../../integrations/wink/wink-bridge";
import { audioManager } from "../../utils/audio-manager";
import { advanceActiveCountdown } from "./activeCountdown";

export interface SessionHudState {
  score: number;
  floors: number;
  combo: number;
  best: number;
}

interface FinalizationState {
  roundId: string;
  finalScore: number;
  playDurationMs: number;
  scoreSubmitted: boolean;
  completed: boolean;
  promise: Promise<void> | null;
}

export interface FloatingCallout {
  id: number;
  message: string;
  tone: "perfect" | "good" | "base";
  combo: number;
}

export function useGameSession(playerName: string) {
  const [status, setStatus] = useState<GameStatus>("paused");
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [hud, setHud] = useState<SessionHudState>({
    score: 0,
    floors: 0,
    combo: 0,
    best: getBestScore(),
  });
  const [lastScore, setLastScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [callout, setCallout] = useState<FloatingCallout | null>(null);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const [winkState, setWinkState] = useState<WinkBridgeState | null>(null);
  const [winkScoreError, setWinkScoreError] = useState<string | null>(null);
  const [hostPaused, setHostPaused] = useState(false);
  const countdownTimerRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const revivesUsedRef = useRef(revivesUsed);
  const hudRef = useRef(hud);
  const hostPausedRef = useRef(false);
  
  const currentRoundRef = useRef<WinkRound | null>(null);
  const finalizationRef = useRef<FinalizationState | null>(null);

  useEffect(() => {
    statusRef.current = status;
    revivesUsedRef.current = revivesUsed;
    hudRef.current = hud;
  }, [status, revivesUsed, hud]);

  const startGame = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (gameOverTimerRef.current) window.clearInterval(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    hostPausedRef.current = false;
    setHostPaused(false);
    setHud((current) => ({ ...current, score: 0, floors: 0, combo: 0 }));
    setStatus("paused");
    setHasStarted(false);
    setSessionKey((current) => current + 1);
    setRevivesUsed(0);
    currentRoundRef.current = winkGame.startRound();
    finalizationRef.current = null;
  };

  const restartGame = () => {
    setStatus("paused");
    setCallout(null);
    startGame();
  };

  const pauseGame = () => {
    if (statusRef.current === "running") setStatus("paused");
  };

  const resumeGame = () => {
    if (statusRef.current === "paused") {
      setHasStarted(true);
      setStatus("running");
    }
  };

  const commitHud = (payload: { score: number; floors: number; combo: number }) => {
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
    setStatus("countdown");
    setCountdown(3);
    setRevivesUsed((current) => current + 1);
    reviveCallback();
    
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = window.setInterval(() => {
      if (hostPausedRef.current) return;
      setCountdown((current) => {
        if (current === null) return null;
        if (current <= 1) {
          if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setStatus("running");
          return null;
        }
        return current - 1;
      });
    }, 320);
  };

  const applyX2Score = () => {
    setHud((current) => ({ ...current, score: current.score * 2 }));
    finishGame({ score: hudRef.current.score * 2, floors: hudRef.current.floors });
  };


  const finishGame = (payload: { score: number; floors: number }) => {
    setStatus("gameOver");
    setLastScore(payload.score);
    const best = Math.max(getBestScore(), payload.score);
    setHud((current) => ({ ...current, best, score: payload.score, floors: payload.floors }));
    
    finalizeRound(payload.score);
  };
  
  const finalizeRound = useCallback(async (finalScore: number) => {
    const round = currentRoundRef.current;
    if (!round) return;
    
    if (!finalizationRef.current || finalizationRef.current.roundId !== round.roundId) {
      finalizationRef.current = {
        roundId: round.roundId,
        finalScore,
        playDurationMs: Date.now() - round.startedAtMs,
        scoreSubmitted: false,
        completed: false,
        promise: null
      };
    }
    
    const state = finalizationRef.current;
    if (state.completed && state.scoreSubmitted) return;
    if (state.promise) return state.promise;
    
    state.promise = (async () => {
      setWinkScoreError(null);

      try {
        // Score persistence and completion are separate platform operations. A
        // score failure must not prevent the completion event from being sent.
        if (!state.scoreSubmitted) {
          try {
            await winkGame.submitFinalScore({ score: state.finalScore });
            state.scoreSubmitted = true;
          } catch (error) {
            const code = error instanceof Error && "code" in error
              ? String((error as Error & { code?: unknown }).code)
              : "SCORE_SUBMISSION_FAILED";
            setWinkScoreError(code === "CAPABILITY_DENIED"
              ? "Điểm không được gửi: tài khoản hiện tại không có quyền lưu điểm (CAPABILITY_DENIED)."
              : `Không thể lưu điểm (${code}). Có thể thử lại.`);
          }
        }

        try {
          if (!state.completed) {
            const ok = winkGame.completeRound(round, { playDurationMs: state.playDurationMs });
            state.completed = ok;
          }
        } catch (error) {
          console.error("Completion error", error);
        }

        if (state.completed) {
          currentRoundRef.current = state.scoreSubmitted ? null : round;
          if (state.scoreSubmitted) refreshLeaderboard();
        }
      } finally {
        state.promise = null;
      }
    })();
    
    return state.promise;
  }, []);

  const refreshLeaderboard = useCallback(() => {
    winkGame.refreshLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  const retryScoreSubmission = useCallback(async () => {
    const state = finalizationRef.current;
    const round = currentRoundRef.current;
    if (!state || !round || state.scoreSubmitted || state.promise) return;

    state.promise = (async () => {
      try {
        await winkGame.submitFinalScore({ score: state.finalScore });
        state.scoreSubmitted = true;
        currentRoundRef.current = null;
        setWinkScoreError(null);
        refreshLeaderboard();
      } catch (error) {
        const code = error instanceof Error && "code" in error
          ? String((error as Error & { code?: unknown }).code)
          : "SCORE_SUBMISSION_FAILED";
        setWinkScoreError(code === "CAPABILITY_DENIED"
          ? "Điểm không được gửi: tài khoản hiện tại không có quyền lưu điểm (CAPABILITY_DENIED)."
          : `Không thể lưu điểm (${code}). Có thể thử lại.`);
      } finally {
        state.promise = null;
      }
    })();

    return state.promise;
  }, [refreshLeaderboard]);

  const pushPlacement = (payload: { message: string; tone: "perfect" | "good" | "base"; combo: number }) => {
    setCallout({
      id: Date.now(),
      message: payload.message,
      tone: payload.tone,
      combo: payload.combo,
    });
  };

  useEffect(() => {
    const stopObserve = winkGame.observe((state) => {
      setWinkState(state);
      if (state?.phase === "ready_anonymous" || state?.phase === "ready_authenticated") {
        refreshLeaderboard();
      }
    });
    
    const stopLifecycle = winkGame.bindLifecycle({
      onPause: () => {
        hostPausedRef.current = true;
        setHostPaused(true);
      },
      onResume: () => {
        hostPausedRef.current = false;
        setHostPaused(false);
      },
      onMute: () => audioManager.setHostMuted(true),
      onUnmute: () => audioManager.setHostMuted(false),
    });

    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      if (gameOverTimerRef.current) window.clearInterval(gameOverTimerRef.current);
      stopObserve();
      stopLifecycle();
      winkGame.dispose();
    };
  }, []);

  return {
    status,
    hasStarted,
    countdown,
    hud,
    lastScore,
    leaderboard,
    callout,
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
    pushPlacement,
    winkState,
    winkScoreError,
    retryScoreSubmission,
    hostPaused,
    canSubmitScore: winkGame.canSubmitScore,
  };
}
