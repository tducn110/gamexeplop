import { useEffect, useRef, useState } from "react";
import { Graphics } from "pixi.js";
import { createGame, getGameResult, startDrop, updateGame, reviveGame } from "../../core/core";
import type { GameState, GameStatus } from "../../core/types";
import { useGameInput } from "../../input/useGameInput";
import { syncSparkGraphics } from "../effects/particles";
import { syncFloatingTexts } from "../effects/floatingText";
import { destroyFeedbackAnimations, runPlacementAnimation } from "../animations/feedbackAnimations";
import { createSpriteRegistry, destroySpriteRegistry, syncWorldSprites } from "./sprites";
import { createGameTextures, destroyGameTextures, type GameTextures } from "./textures";
import { applyCameraTransform } from "./camera";
import { usePixiApp } from "./usePixiApp";
import { getFloors } from "../../logic/rules";
import { audioManager } from "../../../utils/audio-manager";
import { MobileDebugOverlay } from "@/platform/diagnostics/MobileDebugOverlay";
import { createPortraitBackground, destroyPortraitBackground, syncPortraitBackground, type PortraitBackground } from "./portraitBackground";


interface PixiGameStageProps {
  sessionKey: number;
  status: GameStatus;
  onScoreChange: (payload: { score: number; floors: number; combo: number }) => void;
  onGameOver: (payload: { score: number; floors: number }) => void;
  onPlacement: (payload: { message: string; tone: "perfect" | "good" | "base"; combo: number }) => void;
  onResumeGame?: () => void;
  hostPaused: boolean;
  showStartPrompt: boolean;
  gameControllerRef?: React.MutableRefObject<{ revive: () => void } | null>;
  reducedMotion: boolean;
}

function drawBackgroundOverlay(g: Graphics, width: number, height: number, score: number, crashT: number) {
  g.clear();
  // Use CSS background instead. Only draw flash if needed.
  const flash = crashT > 0 && crashT < 260 ? 0.14 * (1 - crashT / 260) : 0;
  if (flash > 0) {
    g.rect(0, 0, width, height).fill({ color: 0xffffff, alpha: flash });
  }
}

export function PixiGameStage({ sessionKey, status, onScoreChange, onGameOver, onPlacement, onResumeGame, hostPaused, showStartPrompt, gameControllerRef, reducedMotion }: PixiGameStageProps) {
  const { wrapRef, appRef, layersRef, sizeRef, ready, viewport } = usePixiApp();
  const gameRef = useRef<GameState | null>(null);
  const texturesRef = useRef<GameTextures | null>(null);
  const registryRef = useRef(createSpriteRegistry());
  const textMapRef = useRef(new Map());
  const finishedKeyRef = useRef<number | null>(null);
  const lastPlacementTokenRef = useRef<number | null>(null);
  const bgGraphicsRef = useRef<Graphics | null>(null);
  const portraitBackgroundRef = useRef<PortraitBackground | null>(null);
  const worldMaskRef = useRef<Graphics | null>(null);
  const effectsMaskRef = useRef<Graphics | null>(null);
  const resumeRequestedRef = useRef(false);
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
    const { background: layer, root, world, effects } = layersRef.current;
    const overlay = new Graphics();
    const worldMask = new Graphics();
    const effectsMask = new Graphics();
    layer.addChild(overlay);
    root.addChild(worldMask, effectsMask);
    world.mask = worldMask;
    effects.mask = effectsMask;
    bgGraphicsRef.current = overlay;
    worldMaskRef.current = worldMask;
    effectsMaskRef.current = effectsMask;

    let backgroundCancelled = false;
    createPortraitBackground().then((background) => {
      if (backgroundCancelled) {
        destroyPortraitBackground(background);
        return;
      }
      portraitBackgroundRef.current = background;
      layer.addChildAt(background.container, 0);
    }).catch((error) => console.error("Failed to load portrait background", error));

    return () => {
      cancelled = true;
      backgroundCancelled = true;
      if (portraitBackgroundRef.current) {
        destroyPortraitBackground(portraitBackgroundRef.current);
        portraitBackgroundRef.current = null;
      }
      world.mask = null;
      effects.mask = null;
      overlay.destroy();
      bgGraphicsRef.current = null;
      worldMask.destroy();
      effectsMask.destroy();
      worldMaskRef.current = null;
      effectsMaskRef.current = null;
    };
  }, [ready, appRef, layersRef, sizeRef]);

  useEffect(() => {
    if (sessionKey <= 0) return;
    gameRef.current = createGame(sizeRef.current.width);
    finishedKeyRef.current = null;
    lastPlacementTokenRef.current = null;
  }, [sessionKey, sizeRef]);

  useEffect(() => {
    if (status !== "paused") resumeRequestedRef.current = false;
  }, [status]);

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
    enabled: texturesReady && !hostPaused && (status === "running" || status === "paused"),
    onAction: (intent) => {
      if (hostPaused) return;
      if (status === "paused") {
        if (!onResumeGame || resumeRequestedRef.current) return;
        resumeRequestedRef.current = true;
        onResumeGame?.();
      } else {
        if (!gameRef.current) return;
        const res = startDrop(gameRef.current, sizeRef.current.height, sizeRef.current.width, intent.distance);
        if (res.gameOver) {
          audioManager.playSfx("bomb", 0.65);
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

      if (!hostPaused && (status === "running" || status === "gameOver")) {
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
            runPlacementAnimation(game.lastPlacement.kind, topSprite, layers.world, game.lastPlacement.combo, reducedMotion);
            
            const pitch = 1.0 + Math.min(game.lastPlacement.combo, 8) * 0.08;
            audioManager.playSfx("slice", 0.5, pitch);

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
      if (portraitBackgroundRef.current) {
        syncPortraitBackground(
          portraitBackgroundRef.current,
          width,
          height,
          game.scroll,
        );
      }
      if (bgGraphicsRef.current) {
        drawBackgroundOverlay(bgGraphicsRef.current, width, height, game.score, game.crashT);
      }
      if (worldMaskRef.current) {
        worldMaskRef.current.clear();
        worldMaskRef.current.rect(0, 0, width, height).fill({ color: 0xffffff, alpha: 1 });
      }
      if (effectsMaskRef.current) {
        effectsMaskRef.current.clear();
        effectsMaskRef.current.rect(0, 0, width, height).fill({ color: 0xffffff, alpha: 1 });
      }
      
      applyCameraTransform(layers.root, game);

      syncWorldSprites(layers.world, game, texturesRef.current!, registry, sizeRef.current.height, sizeRef.current.width);
      syncSparkGraphics(layers.sparkGraphics, game);
      syncFloatingTexts(layers.effects, game, textMap);
    };

    ticker.add(tick);
    return () => {
      ticker.remove(tick);
    };
  }, [ready, texturesReady, appRef, layersRef, onGameOver, onPlacement, onScoreChange, sessionKey, sizeRef, status, hostPaused]);

  useEffect(() => {
    return () => {
      if (layersRef.current) {
        destroyFeedbackAnimations(layersRef.current.world);
        layersRef.current.root.position.set(0, 0);
      }
      destroySpriteRegistry(registryRef.current);
    };
  }, [layersRef]);

  const stageReady = viewport.ready && ready && texturesReady;

  return (
    <>
      <div
        ref={wrapRef}
        className="game-stage"
        data-viewport-ready={viewport.ready ? "true" : "false"}
        aria-label="Sân chơi kéo lên trời"
      >
        {!stageReady ? <div className="stage-loading">Đang tải sân chơi...</div> : null}
        {stageReady && status === "paused" && showStartPrompt ? (
          <div className="start-ready" role="status">Chạm để bắt đầu</div>
        ) : null}
      </div>
      <MobileDebugOverlay
        viewport={viewport.diagnostics}
        renderer={appRef.current ? {
          width: appRef.current.renderer.width,
          height: appRef.current.renderer.height,
        } : null}
      />
    </>
  );
}
