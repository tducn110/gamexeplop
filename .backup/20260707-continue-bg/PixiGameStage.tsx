import { useEffect, useRef } from "react";
import { Graphics } from "pixi.js";
import { createGame, getGameResult, startDrop, updateGame, reviveGame } from "../../core/core";
import type { GameState, GameStatus } from "../../core/types";
import { useGameInput } from "../../input/useGameInput";
import { syncSparkGraphics } from "../effects/particles";
import { syncFloatingTexts } from "../effects/floatingText";
import { destroyFeedbackAnimations, runPlacementAnimation } from "../animations/feedbackAnimations";
import { createSpriteRegistry, destroySpriteRegistry, syncWorldSprites } from "./sprites";
import { createGameTextures, destroyGameTextures, type GameTextures } from "./textures";
import { usePixiApp } from "./usePixiApp";
import type { LeaderboardEntry } from "../../db/schema";
import { getFloors } from "../../logic/rules";

interface PixiGameStageProps {
  sessionKey: number;
  status: GameStatus;
  onScoreChange: (payload: { score: number; floors: number; combo: number }) => void;
  onGameOver: (payload: { score: number; floors: number }) => void;
  onPlacement: (payload: { message: string; tone: "perfect" | "good" | "base"; combo: number }) => void;
  onResumeGame?: () => void;
  gameControllerRef?: React.MutableRefObject<{ revive: () => void } | null>;
}

function drawCloud(g: Graphics, x: number, y: number, scale: number, alpha: number) {
  g.ellipse(x, y + 8 * scale, 36 * scale, 12 * scale).fill({ color: 0xffffff, alpha: alpha * 0.32 });
  g.circle(x - 24 * scale, y, 15 * scale).fill({ color: 0xffffff, alpha });
  g.circle(x, y - 9 * scale, 23 * scale).fill({ color: 0xffffff, alpha });
  g.circle(x + 26 * scale, y, 17 * scale).fill({ color: 0xffffff, alpha });
  g.roundRect(x - 42 * scale, y, 86 * scale, 20 * scale, 10 * scale).fill({ color: 0xffffff, alpha });
}

function drawSkyClimbBackground(g: Graphics, width: number, height: number, score: number, crashT: number) {
  const tier = Math.min(1, score / 900);
  const groundDrop = Math.min(height * 0.34, score * 0.28);
  const horizon = height * 0.78 + groundDrop;
  const flash = crashT > 0 && crashT < 260 ? 0.14 * (1 - crashT / 260) : 0;

  g.clear();
  g.rect(0, 0, width, height).fill({ color: tier > 0.5 ? 0x8fcdf5 : 0xadd7f1 });
  g.rect(0, 0, width, height * 0.34).fill({ color: 0xf8e6b4, alpha: Math.max(0.16, 0.42 - tier * 0.22) });
  g.rect(0, height * 0.34, width, height * 0.38).fill({ color: 0xbfe5f7, alpha: 0.58 });
  g.rect(0, height * 0.68, width, height * 0.32).fill({ color: 0xd9edf8, alpha: 0.68 });

  const sunX = width * (0.72 - tier * 0.2);
  const sunY = height * (0.18 + tier * 0.07);
  g.circle(sunX, sunY, Math.max(42, width * 0.14)).fill({ color: 0xfff2a6, alpha: 0.28 });
  g.circle(sunX, sunY, Math.max(20, width * 0.055)).fill({ color: 0xffd769, alpha: 0.88 });

  const cloudShift = (score * 0.34) % width;
  drawCloud(g, width * 0.18 - cloudShift * 0.18, height * 0.22, 0.82, 0.74);
  drawCloud(g, width * 0.82 - cloudShift * 0.12, height * 0.34, 1.05, 0.7);
  drawCloud(g, width * 0.38 + cloudShift * 0.09, height * 0.5, 0.7, 0.62);
  drawCloud(g, width * 0.66, height * 0.66 - tier * 120, 1.2, 0.42);

  g.roundRect(-width * 0.08, horizon - 34, width * 0.55, 110, 52).fill({ color: 0x8fb06a, alpha: Math.max(0, 0.82 - tier * 0.85) });
  g.roundRect(width * 0.42, horizon - 54, width * 0.68, 130, 64).fill({ color: 0x6f9851, alpha: Math.max(0, 0.75 - tier * 0.78) });
  g.rect(0, horizon, width, height - horizon).fill({ color: 0xd5b36b, alpha: Math.max(0, 0.88 - tier * 0.9) });

  for (let i = 0; i < 8; i += 1) {
    const x = (i * 73 + score * 0.18) % (width + 90) - 45;
    const y = height * 0.58 + ((i % 3) * 46) - tier * 120;
    g.moveTo(x, y);
    g.lineTo(x + 16, y + 38);
    g.lineTo(x - 16, y + 38);
    g.closePath();
    g.fill({ color: 0xffffff, alpha: 0.18 });
  }

  if (flash > 0) {
    g.rect(0, 0, width, height).fill({ color: 0xffffff, alpha: flash });
  }
}

export function PixiGameStage({ sessionKey, status, onScoreChange, onGameOver, onPlacement, onResumeGame, gameControllerRef }: PixiGameStageProps) {
  const { wrapRef, appRef, layersRef, sizeRef, ready } = usePixiApp();
  const gameRef = useRef<GameState | null>(null);
  const texturesRef = useRef<GameTextures | null>(null);
  const registryRef = useRef(createSpriteRegistry());
  const textMapRef = useRef(new Map());
  const finishedKeyRef = useRef<number | null>(null);
  const lastPlacementTokenRef = useRef<number | null>(null);
  const bgGraphicsRef = useRef<Graphics | null>(null);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    if (!texturesRef.current) {
      texturesRef.current = createGameTextures(appRef.current);
    }
  }, [ready, appRef, layersRef]);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    const bg = new Graphics();
    layersRef.current.background.addChild(bg);
    bgGraphicsRef.current = bg;

    return () => {
      bg.destroy();
      bgGraphicsRef.current = null;
    };
  }, [ready, appRef, layersRef]);

  useEffect(() => {
    if (sessionKey <= 0) return;
    gameRef.current = createGame(sizeRef.current.width);
    finishedKeyRef.current = null;
    lastPlacementTokenRef.current = null;
  }, [sessionKey, sizeRef]);

  useEffect(() => {
    if (gameControllerRef) {
      gameControllerRef.current = {
        revive: () => {
          if (gameRef.current) {
            reviveGame(gameRef.current, sizeRef.current.width);
            finishedKeyRef.current = null;
          }
        }
      };
    }
  }, [gameControllerRef, sizeRef]);

  useGameInput({
    app: appRef.current,
    enabled: status === "running" || status === "paused",
    onAction: (intent) => {
      if (status === "paused") {
        onResumeGame?.();
      } else {
        if (!gameRef.current) return;
        const res = startDrop(gameRef.current, sizeRef.current.height, sizeRef.current.width, intent.distance);
        if (res.gameOver) {
          onGameOver?.(getGameResult(gameRef.current));
        }
      }
    },
  });

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current || !texturesRef.current) return;

    const ticker = appRef.current.ticker;
    const layers = layersRef.current;
    const registry = registryRef.current;
    const textMap = textMapRef.current;

    const tick = () => {
      const game = gameRef.current;
      if (!game) return;

      if (status === "running" || status === "gameOver") {
        const result = updateGame(game, ticker.deltaMS, sizeRef.current.width, sizeRef.current.height);
        
        if (status === "running") {
          onScoreChange({
            score: game.score,
            floors: getFloors(game),
            combo: game.combo,
          });

          if (game.lastPlacement && game.lastPlacement.token !== lastPlacementTokenRef.current) {
            lastPlacementTokenRef.current = game.lastPlacement.token;
            const topSprite = registry.blocks.get(`block-${game.blocks.length - 1}`) ?? null;
            runPlacementAnimation(game.lastPlacement.kind, topSprite, layers.world, game.lastPlacement.combo);
            onPlacement({
              message: game.lastPlacement.kind === "perfect" ? "Đạt chuẩn!" : game.lastPlacement.kind === "good" ? "Rất gần!" : "Thêm 1 tầng",
              tone: game.lastPlacement.kind,
              combo: game.lastPlacement.combo,
            });
          }

          if (result.gameOver && finishedKeyRef.current !== sessionKey) {
            finishedKeyRef.current = sessionKey;
            onGameOver(getGameResult(game));
          }
        }
      }

      const { width, height } = sizeRef.current;
      if (bgGraphicsRef.current) {
        drawSkyClimbBackground(bgGraphicsRef.current, width, height, game.score, game.crashT);
      }
      const crashShake = game.sub === "gameOver" && game.crashT < 620 ? (1 - game.crashT / 620) * 9 : 0;
      layers.root.position.set(
        crashShake ? (Math.random() - 0.5) * crashShake : 0,
        crashShake ? (Math.random() - 0.5) * crashShake : 0
      );

      syncWorldSprites(layers.world, game, texturesRef.current!, registry, sizeRef.current.height, sizeRef.current.width);
      syncSparkGraphics(layers.sparkGraphics, game);
      syncFloatingTexts(layers.effects, game, textMap);
    };

    ticker.add(tick);
    return () => {
      ticker.remove(tick);
    };
  }, [ready, appRef, layersRef, onGameOver, onPlacement, onScoreChange, sessionKey, sizeRef, status]);

  useEffect(() => {
    return () => {
      if (layersRef.current) {
        destroyFeedbackAnimations(layersRef.current.world);
        layersRef.current.root.position.set(0, 0);
      }
      destroySpriteRegistry(registryRef.current);
      destroyGameTextures(texturesRef.current);
    };
  }, [layersRef]);

  return <div ref={wrapRef} className="game-stage" aria-label="Sân chơi kéo lên trời" />;
}
