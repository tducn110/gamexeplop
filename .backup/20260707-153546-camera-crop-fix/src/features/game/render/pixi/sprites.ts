import { Container, Graphics, Sprite, Text, Texture, type Container as PixiContainer } from "pixi.js";
import { getMovingBlockY } from "../../core/core";
import type { GameState } from "../../core/types";
import {
  BIRD_VISUAL_SCALE_X,
  BIRD_VISUAL_SCALE_Y,
  BLOCK_HEIGHT,
} from "../../core/constants";
import { getBlockY } from "../../logic/rules";
import type { GameTextures } from "./textures";

type BlockView = Container & {
  shadow: Graphics;
  sprite: Sprite;
  art: Graphics;
};

export interface SpriteRegistry {
  blocks: Map<string, BlockView>;
  pieces: Map<string, BlockView>;
  moving: BlockView | null;
  dropping: BlockView | null;
  comboText: Text | null;
  perfectHighlight: Graphics | null;
  crashBird: BlockView | null;
  bird: BlockView | null;
}

function fitSpriteByWidth(sprite: Sprite, targetWidth: number) {
  const textureWidth = Math.max(1, sprite.texture.width);
  const textureHeight = Math.max(1, sprite.texture.height);
  const scale = targetWidth / textureWidth;
  const renderWidth = textureWidth * scale;
  const renderHeight = textureHeight * scale;

  sprite.scale.set(scale);
  sprite.position.set(0, BLOCK_HEIGHT - renderHeight);

  return { width: renderWidth, height: renderHeight, x: sprite.x, y: sprite.y };
}

function createBlockView(layer: PixiContainer): BlockView {
  const view = new Container() as BlockView;
  view.shadow = new Graphics();
  view.sprite = new Sprite(Texture.EMPTY);
  view.art = new Graphics();
  view.sprite.anchor.set(0, 0);
  view.addChild(view.shadow, view.sprite, view.art);
  layer.addChild(view);
  return view;
}

function ensureBlockView(
  map: Map<string, BlockView>,
  key: string,
  layer: PixiContainer
): BlockView {
  let view = map.get(key);
  if (!view) {
    view = createBlockView(layer);
    map.set(key, view);
  }
  return view;
}

function ensureSingleBlockView(view: BlockView | null, layer: PixiContainer): BlockView {
  return view ?? createBlockView(layer);
}

function drawBlockArt(
  view: BlockView,
  width: number,
  index: number,
  textures: GameTextures,
  options: { active?: boolean; alpha?: number; falling?: boolean } = {}
) {
  const shadow = view.shadow;
  const sprite = view.sprite;
  const art = view.art;
  const alpha = options.alpha ?? 1;
  const safeWidth = Math.max(0, width);
  const blockTexture = textures.block;

  shadow.clear();
  art.clear();
  sprite.visible = safeWidth > 0;
  sprite.texture = blockTexture;
  const bounds = fitSpriteByWidth(sprite, safeWidth);
  const radius = Math.max(7, Math.min(13, bounds.width * 0.05));

  shadow.ellipse(safeWidth / 2, BLOCK_HEIGHT + 8, Math.max(20, safeWidth * 0.43), 7)
    .fill({ color: 0x173447, alpha: options.active ? 0.28 * alpha : 0.2 * alpha });

  if (options.active) {
    art.roundRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10, radius + 5)
      .stroke({ color: 0xfff1a8, width: 3.5, alpha: 0.82 });
    art.moveTo(width / 2, -22);
    art.lineTo(width / 2 - 9, -8);
    art.lineTo(width / 2 + 9, -8);
    art.closePath();
    art.fill({ color: 0xfff1a8, alpha: 0.82 });
  }

  if (options.falling) {
    art.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius)
      .stroke({ color: 0xfff1a8, width: 2.3, alpha: 0.42 * alpha });
  }
}

function applyBlockView(
  view: BlockView,
  x: number,
  y: number,
  width: number,
  index: number,
  textures: GameTextures,
  options: { active?: boolean; alpha?: number; rotation?: number; falling?: boolean } = {}
) {
  drawBlockArt(view, width, index, textures, options);
  view.alpha = options.alpha ?? 1;
  view.visible = true;

  if (options.falling) {
    view.pivot.set(width / 2, BLOCK_HEIGHT / 2);
    view.position.set(x + width / 2, y + BLOCK_HEIGHT / 2);
    view.rotation = options.rotation ?? 0;
  } else {
    view.pivot.set(0, 0);
    view.position.set(x, y);
    view.rotation = 0;
  }
}

function drawCrashBird(view: BlockView, t: number) {
  view.shadow.clear();
  view.sprite.visible = false;
  const art = view.art;
  const flap = Math.sin(t * 0.026) * 7;

  art.clear();
  art.ellipse(0, 0, 28, 15).fill({ color: 0x354458, alpha: 0.95 });
  art.circle(23, -5, 11).fill({ color: 0x354458, alpha: 0.95 });
  art.moveTo(31, -5).lineTo(48, -11).lineTo(35, 1).closePath().fill({ color: 0xe89a35, alpha: 0.96 });
  art.moveTo(-3, -3).quadraticCurveTo(-34, -34 + flap, -58, -6).quadraticCurveTo(-28, 3, -3, 8).fill({ color: 0x5d6d83, alpha: 0.92 });
  art.moveTo(2, 4).quadraticCurveTo(-28, 38 - flap, -51, 12).quadraticCurveTo(-24, 8, 2, 4).fill({ color: 0x73839b, alpha: 0.9 });
  art.circle(27, -8, 2.4).fill({ color: 0xffffff, alpha: 0.95 });
  art.circle(28, -8, 1.1).fill({ color: 0x182234, alpha: 1 });
}

function drawObstacleBird(view: BlockView, t: number) {
  view.shadow.clear();
  view.sprite.visible = false;
  const art = view.art;
  const flap = Math.sin(t * 0.012) * 4;

  art.clear();
  art.ellipse(0, 0, 21, 10).fill({ color: 0x3d4b5e, alpha: 0.96 });
  art.circle(17, -4, 8).fill({ color: 0x3d4b5e, alpha: 0.96 });
  art.moveTo(24, -4).lineTo(36, -9).lineTo(27, 2).closePath().fill({ color: 0xe89a35, alpha: 0.98 });
  art.moveTo(-2, -2).quadraticCurveTo(-24, -22 + flap, -43, -4).quadraticCurveTo(-22, 2, -2, 6).fill({ color: 0x65758c, alpha: 0.92 });
  art.moveTo(1, 3).quadraticCurveTo(-22, 25 - flap, -38, 9).quadraticCurveTo(-18, 6, 1, 3).fill({ color: 0x7f8fa6, alpha: 0.9 });
  art.circle(20, -6, 1.9).fill({ color: 0xffffff, alpha: 0.95 });
  art.circle(21, -6, 0.9).fill({ color: 0x182234, alpha: 1 });
}

export function createSpriteRegistry(): SpriteRegistry {
  return {
    blocks: new Map(),
    pieces: new Map(),
    moving: null,
    dropping: null,
    comboText: null,
    perfectHighlight: null,
    crashBird: null,
    bird: null,
  };
}

export function syncWorldSprites(
  layer: PixiContainer,
  state: GameState,
  textures: GameTextures,
  registry: SpriteRegistry,
  viewportHeight: number,
  appWidth: number
) {
  const activeBlockIds = new Set<string>();
  for (let index = 0; index < state.blocks.length; index += 1) {
    const key = `block-${index}`;
    const block = state.blocks[index];
    const view = ensureBlockView(registry.blocks, key, layer);
    applyBlockView(view, block.x, getBlockY(index, viewportHeight, state.scroll), block.w, index, textures);
    activeBlockIds.add(key);
  }

  for (const [key, view] of registry.blocks.entries()) {
    if (!activeBlockIds.has(key)) {
      view.destroy({ children: true });
      registry.blocks.delete(key);
    }
  }

  const nextIndex = state.blocks.length;

  if (state.sub === "moving") {
    registry.moving = ensureSingleBlockView(registry.moving, layer);
    applyBlockView(registry.moving, state.mv.x, getMovingBlockY(state, viewportHeight), state.mv.w, nextIndex, textures, { active: true });
  } else if (registry.moving) {
    registry.moving.visible = false;
  }

  registry.dropping = ensureSingleBlockView(registry.dropping, layer);
  if (state.drop) {
    applyBlockView(registry.dropping, state.drop.x, state.drop.y, state.drop.w, nextIndex, textures, { alpha: 0.96, falling: true });
  } else {
    registry.dropping.visible = false;
  }

  const activePieceIds = new Set<string>();
  for (let index = 0; index < state.pieces.length; index += 1) {
    const piece = state.pieces[index];
    const key = `piece-${index}`;
    const view = ensureBlockView(registry.pieces, key, layer);
    applyBlockView(view, piece.x, piece.y, piece.w, Math.max(0, state.blocks.length - 1), textures, {
      alpha: piece.alpha,
      rotation: piece.rot,
      falling: true,
    });
    activePieceIds.add(key);
  }

  for (const [key, view] of registry.pieces.entries()) {
    if (!activePieceIds.has(key)) {
      view.destroy({ children: true });
      registry.pieces.delete(key);
    }
  }

  if (state.combo > 1) {
    if (!registry.comboText) {
      registry.comboText = new Text({
        text: `Combo x${state.combo}`,
        style: {
          fontFamily: "var(--font-family, system-ui)",
          fontSize: 24,
          fontWeight: "900",
          fill: "#fff8d4",
          stroke: { color: "#5f3b1f", width: 3 },
        },
      });
      registry.comboText.anchor.set(0.5);
      layer.addChild(registry.comboText);
    }
    registry.comboText.text = `Combo x${state.combo}`;
    registry.comboText.x = appWidth / 2;
    registry.comboText.y = 104;
    registry.comboText.visible = true;
  } else if (registry.comboText) {
    registry.comboText.visible = false;
  }

  if (state.perfectHighlight) {
    if (!registry.perfectHighlight) {
      registry.perfectHighlight = new Graphics();
      layer.addChild(registry.perfectHighlight);
    }
    registry.perfectHighlight.clear();
    const progress = 1 - state.perfectHighlight.alpha;
    const h = BLOCK_HEIGHT + progress * 20;
    const yOffset = -progress * 10;

    registry.perfectHighlight.roundRect(
      state.perfectHighlight.x - 4,
      state.perfectHighlight.y + yOffset - 4,
      state.perfectHighlight.w + 8,
      h + 8,
      12
    );
    registry.perfectHighlight.stroke({ color: 0xfff1a8, width: 4, alpha: Math.max(0, state.perfectHighlight.alpha) });
    registry.perfectHighlight.visible = true;
  } else if (registry.perfectHighlight) {
    registry.perfectHighlight.visible = false;
  }

  if (state.sub === "gameOver" && state.crashT < 1200) {
    registry.crashBird = ensureSingleBlockView(registry.crashBird, layer);
    drawCrashBird(registry.crashBird, state.crashT);
    const targetY = getBlockY(state.blocks.length - 1, viewportHeight, state.scroll) - 18;
    const progress = Math.min(1, state.crashT / 520);
    registry.crashBird.position.set(appWidth + 96 - progress * (appWidth * 0.7 + 126), targetY - 74 + Math.sin(progress * Math.PI) * 24);
    registry.crashBird.rotation = -0.18 + progress * 0.45;
    registry.crashBird.scale.set(1 + progress * 0.18);
    registry.crashBird.visible = true;
  } else if (registry.crashBird) {
    registry.crashBird.visible = false;
  }

  if (state.bird && state.sub !== "gameOver") {
    registry.bird = ensureSingleBlockView(registry.bird, layer);
    drawObstacleBird(registry.bird, state.elapsedMs);
    registry.bird.position.set(state.bird.x + state.bird.w / 2, state.bird.y + state.bird.h / 2);
    registry.bird.scale.set(BIRD_VISUAL_SCALE_X, BIRD_VISUAL_SCALE_Y);
    registry.bird.rotation = state.bird.vx > 0 ? 0 : Math.PI;
    registry.bird.visible = true;
  } else if (registry.bird) {
    registry.bird.visible = false;
  }
}

export function destroySpriteRegistry(registry: SpriteRegistry) {
  for (const view of registry.blocks.values()) view.destroy({ children: true });
  for (const view of registry.pieces.values()) view.destroy({ children: true });
  registry.moving?.destroy({ children: true });
  registry.dropping?.destroy({ children: true });
  registry.comboText?.destroy();
  registry.perfectHighlight?.destroy();
  registry.crashBird?.destroy({ children: true });
  registry.bird?.destroy({ children: true });
}
