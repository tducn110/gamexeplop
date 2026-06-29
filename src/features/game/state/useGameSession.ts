import { useEffect, useRef, useState } from "react";
import { getLeaderboard } from "../backend/leaderboardApi";
import { getBestScore, saveScore } from "../backend/scoreApi";
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
  const [status, setStatus] = useState<GameStatus>("idle");
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
  const countdownTimerRef = useRef<number | null>(null);

  const startGame = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    setHud((current) => ({ ...current, score: 0, floors: 0, combo: 0 }));
    setCountdown(3);
    setStatus("countdown");
    setSessionKey((current) => current + 1);
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

  const restartGame = () => {
    setStatus("idle");
    setCallout(null);
    startGame();
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
    commitHud,
    finishGame,
    pushPlacement,
  };
}
