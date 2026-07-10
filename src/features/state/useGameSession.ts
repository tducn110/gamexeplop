import { useEffect, useRef, useState } from "react";
import { getLeaderboard } from "../backend/leaderboardApi";
import { getBestScore, saveScore } from "../backend/scoreApi";
import { CRASH_CLIMAX_MS } from "../core/constants";
import type { GameStatus } from "../core/types";

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [hud, setHud] = useState<SessionHudState>({
    score: 0,
    floors: 0,
    combo: 0,
    best: getBestScore(),
  });
  const [lastScore, setLastScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState(() => getLeaderboard());
  const [callout, setCallout] = useState<FloatingCallout | null>(null);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const countdownTimerRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);

  const startGame = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    setHud((current) => ({ ...current, score: 0, floors: 0, combo: 0 }));
    setStatus("paused");
    setSessionKey((current) => current + 1);
    setRevivesUsed(0);
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
    if (status === "paused") setStatus("running");
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
        setStatus("x2score");
      }
    }, CRASH_CLIMAX_MS);
  };

  const skipRevive = () => {
    setStatus("x2score");
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

  const skipX2Score = () => {
    finishGame({ score: hud.score, floors: hud.floors });
  };

  const finishGame = (payload: { score: number; floors: number }) => {
    setStatus("gameOver");
    setLastScore(payload.score);
    saveScore({
      playerName,
      score: payload.score,
      floors: payload.floors,
    });
    const best = Math.max(getBestScore(), payload.score);
    setHud((current) => ({ ...current, best, score: payload.score, floors: payload.floors }));
    setLeaderboard(getLeaderboard());
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
      if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
    };
  }, []);

  return {
    status,
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
    skipX2Score,
    pushPlacement,
  };
}
