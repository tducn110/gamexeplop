import { useEffect, useRef, useState, useCallback } from "react";
import { CRASH_CLIMAX_MS } from "../core/constants";
import type { GameStatus } from "../core/types";
import { audioManager } from "../../utils/audio-manager";
import { advanceActiveCountdown } from "./activeCountdown";

export interface SessionHudState {
  score: number;
  floors: number;
  combo: number;
  best: number;
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
    best: parseInt(localStorage.getItem('bestScore') || '0', 10),
  });
  const [lastScore, setLastScore] = useState(0);
  const [callout, setCallout] = useState<FloatingCallout | null>(null);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const [hostPaused, setHostPaused] = useState(false);
  const countdownTimerRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const revivesUsedRef = useRef(revivesUsed);
  const hudRef = useRef(hud);
  const hostPausedRef = useRef(false);

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
    
    setHud((current) => {
      const newBest = Math.max(current.best, payload.score);
      localStorage.setItem('bestScore', newBest.toString());
      return { ...current, score: payload.score, floors: payload.floors, best: newBest };
    });
  };

  const pushPlacement = (payload: { message: string; tone: "perfect" | "good" | "base"; combo: number }) => {
    setCallout({
      id: Date.now(),
      message: payload.message,
      tone: payload.tone,
      combo: payload.combo,
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
    hostPaused,
  };
}
