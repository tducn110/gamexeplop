import { useEffect, useRef, useState } from "react";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";
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

const BACKGROUND_ASSET = "/assets/Background.png";

interface PixiGameStageProps {
  sessionKey: number;
  status: GameStatus;
  onScoreChange: (payload: { score: number; floors: number; combo: number }) => void;
  onGameOver: (payload: { score: number; floors: number }) => void;
  onPlacement: (payload: { message: string; tone: "perfect" | "good" | "base"; combo: number }) => void;
  onResumeGame?: () => void;
  gameControllerRef?: React.MutableRefObject<{ revive: () => void } | null>;
}

function fitBackgroundSprite(sprite: Sprite, width: number, height: number) {
  const textureWidth = Math.max(1, sprite.texture.width);
  const textureHeight = Math.max(1, sprite.texture.height);
  const scale = Math.max(width / textureWidth, height / textureHeight);

  sprite.anchor.set(0.5);
  sprite.position.set(width / 2, height / 2);
  sprite.scale.set(scale);
}

function drawBackgroundOverlay(g: Graphics, width: number, height: number, score: number, crashT: number) {
  const climb = Math.min(1, score / 900);
  const flash = crashT > 0 && crashT < 260 ? 0.14 * (1 - crashT / 260) : 0;

  g.clear();
  g.rect(0, 0, width, height).fill({ color: 0x00a8d8, alpha: 0.05 });
  g.rect(0, 0, width, height * 0.32).fill({ color: 0xffffff, alpha: 0.1 - climb * 0.04 });
  g.rect(0, height * 0.58, width, height * 0.42).fill({ color: 0xffa51f, alpha: 0.1 + climb * 0.03 });
  g.rect(0, 0, width, height).stroke({ color: 0x6a3d16, width: 2, alpha: 0.08 });

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
  const bgSpriteRef = useRef<Sprite | null>(null);
  const bgGraphicsRef = useRef<Graphics | null>(null);
  const [texturesReady, setTexturesReady] = useState(false);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    let cancelled = false;
    setTexturesReady(false);

    createGameTextures(appRef.current)
      .then((textures) => {
        if (cancelled) {
          destroyGameTextures(textures);
          return;
        }

        texturesRef.current = textures;
        setTexturesReady(true);
      })
      .catch((error) => {
        console.error("Failed to load Pixi game textures", error);
      });

    return () => {
      cancelled = true;
      destroyGameTextures(texturesRef.current);
      texturesRef.current = null;
    };
  }, [ready, appRef, layersRef]);

  useEffect(() => {
    if (!ready || !appRef.current || !layersRef.current) return;
    let cancelled = false;
    const layer = layersRef.current.background;
    const overlay = new Graphics();
    layer.addChild(overlay);
    bgGraphicsRef.current = overlay;

    Assets.load<Texture>(BACKGROUND_ASSET).then((texture) => {
      if (cancelled) return;
      const sprite = new Sprite(texture);
      bgSpriteRef.current = sprite;
      layer.addChildAt(sprite, 0);
      fitBackgroundSprite(sprite, sizeRef.current.width, sizeRef.current.height);
    });

    return () => {
      cancelled = true;
      bgSpriteRef.current?.destroy();
      bgSpriteRef.current = null;
      overlay.destroy();
      bgGraphicsRef.current = null;
    };
  }, [ready, appRef, layersRef, sizeRef]);

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
    if (!ready || !texturesReady || !appRef.current || !layersRef.current || !texturesRef.current) return;

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
      if (bgSpriteRef.current) {
        fitBackgroundSprite(bgSpriteRef.current, width, height);
      }
      if (bgGraphicsRef.current) {
        drawBackgroundOverlay(bgGraphicsRef.current, width, height, game.score, game.crashT);
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
  }, [ready, texturesReady, appRef, layersRef, onGameOver, onPlacement, onScoreChange, sessionKey, sizeRef, status]);

  useEffect(() => {
    return () => {
      if (layersRef.current) {
        destroyFeedbackAnimations(layersRef.current.world);
        layersRef.current.root.position.set(0, 0);
      }
      destroySpriteRegistry(registryRef.current);
    };
  }, [layersRef]);

  return <div ref={wrapRef} className="game-stage" aria-label="Sân chơi kéo lên trời" />;
}
