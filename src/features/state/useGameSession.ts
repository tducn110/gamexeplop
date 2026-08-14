import { useEffect, useRef, useState, useCallback } from "react";
import { getBestScore } from "../backend/scoreApi";
import { CRASH_CLIMAX_MS } from "../core/constants";
import type { GameStatus } from "../core/types";
import { winkGame, type WinkRound } from "../../integrations/wink/client";
import type { LeaderboardResponse, WinkBridgeState } from "../../integrations/wink/wink-bridge";

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
  const countdownTimerRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  
  const currentRoundRef = useRef<WinkRound | null>(null);
  const finalizationRef = useRef<FinalizationState | null>(null);

  const startGame = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
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
    if (status === "running") setStatus("paused");
  };

  const resumeGame = () => {
    if (status === "paused") {
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
    gameOverTimerRef.current = window.setTimeout(() => {
      gameOverTimerRef.current = null;
      if (revivesUsed < 1) {
        setStatus("revive");
      } else {
        finishGame({ score: hud.score, floors: hud.floors });
      }
    }, CRASH_CLIMAX_MS);
  };

  const skipRevive = () => {
    finishGame({ score: hud.score, floors: hud.floors });
  };

  const confirmRevive = (reviveCallback: () => void) => {
    setStatus("countdown");
    setCountdown(3);
    setRevivesUsed((current) => current + 1);
    reviveCallback();
    
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = window.setInterval(() => {
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
    finishGame({ score: hud.score * 2, floors: hud.floors });
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
        scoreSubmitted: !winkGame.canSubmitScore,
        completed: false,
        promise: null
      };
    }
    
    const state = finalizationRef.current;
    if (state.completed && state.scoreSubmitted) return;
    if (state.promise) return state.promise;
    
    state.promise = (async () => {
      try {
        if (!state.scoreSubmitted && winkGame.canSubmitScore) {
          await winkGame.submitFinalScore({ score: state.finalScore });
          state.scoreSubmitted = true;
        }
        if (!state.completed) {
          const ok = winkGame.completeRound(round, { playDurationMs: state.playDurationMs });
          state.completed = ok;
        }
        if (state.completed && state.scoreSubmitted) {
           currentRoundRef.current = null;
           refreshLeaderboard();
        }
      } catch (e) {
        console.error("Finalization error", e);
      } finally {
        state.promise = null;
      }
    })();
    
    return state.promise;
  }, []);

  const refreshLeaderboard = useCallback(() => {
    winkGame.refreshLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

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
      onPause: pauseGame,
      onResume: resumeGame,
      // Add audio-manager calls if accessible globally, but for now we'll just handle state
    });

    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
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
    canSubmitScore: winkGame.canSubmitScore,
  };
}
