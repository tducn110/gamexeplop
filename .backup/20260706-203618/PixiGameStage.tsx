import { useEffect, useRef } from "react";
import { Assets, Sprite, Texture } from "pixi.js";
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

export function PixiGameStage({ sessionKey, status, onScoreChange, onGameOver, onPlacement, onResumeGame, gameControllerRef }: PixiGameStageProps) {
  const { wrapRef, appRef, layersRef, sizeRef, ready } = usePixiApp();
  const gameRef = useRef<GameState | null>(null);
  const texturesRef = useRef<GameTextures | null>(null);
  const registryRef = useRef(createSpriteRegistry());
  const textMapRef = useRef(new Map());
  const finishedKeyRef = useRef<number | null>(null);
  const lastPlacementTokenRef = useRef<number | null>(null);
  const bgSpriteRef = useRef<Sprite | null>(null);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    if (!texturesRef.current) {
      texturesRef.current = createGameTextures(appRef.current);
    }
  }, [ready, appRef, layersRef]);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    
    let active = true;

    // Load background
    Assets.load("/assets/background.png").then((texture) => {
      if (!active || !layersRef.current) return;
      
      const bgSprite = new Sprite(texture);
      bgSprite.anchor.set(0.5, 0.5);
      layersRef.current.background.addChild(bgSprite);
      bgSpriteRef.current = bgSprite;
    }).catch(err => {
      console.error("Failed to load background texture:", err);
    });

    return () => {
      active = false;
      if (bgSpriteRef.current) {
        bgSpriteRef.current.destroy({ texture: true });
        bgSpriteRef.current = null;
      }
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
    onAction: () => {
      if (status === "paused") {
        onResumeGame?.();
      } else {
        if (!gameRef.current) return;
        const res = startDrop(gameRef.current, sizeRef.current.height, sizeRef.current.width);
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

      const bgSprite = bgSpriteRef.current;
      if (bgSprite && bgSprite.texture) {
        const { width, height } = sizeRef.current;
        bgSprite.x = width / 2;
        bgSprite.y = height / 2;

        const textureWidth = bgSprite.texture.width;
        const textureHeight = bgSprite.texture.height;
        if (textureWidth > 0 && textureHeight > 0) {
          const scaleX = width / textureWidth;
          const scaleY = height / textureHeight;
          const scale = Math.max(scaleX, scaleY);
          bgSprite.scale.set(scale);
        }
      }

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
      }
      destroySpriteRegistry(registryRef.current);
      destroyGameTextures(texturesRef.current);
    };
  }, [layersRef]);

  return <div ref={wrapRef} className="game-stage" aria-label="San choi rom" />;
}
