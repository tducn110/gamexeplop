import { Container, Graphics, Text, type Container as PixiContainer } from "pixi.js";
import { getMovingBlockY } from "../../core/core";
import type { GameState } from "../../core/types";
import { BLOCK_HEIGHT } from "../../core/constants";
import { getBlockY } from "../../logic/rules";
import type { GameTextures } from "./textures";

type BlockView = Container & { art: Graphics };

export interface SpriteRegistry {
  blocks: Map<string, BlockView>;
  pieces: Map<string, BlockView>;
  moving: BlockView | null;
  dropping: BlockView | null;
  comboText: Text | null;
  perfectHighlight: Graphics | null;
  crashBird: BlockView | null;
}

const BLOCK_STYLES = [
  { top: 0xffca63, body: 0xf07a1f, side: 0xa34114, trim: 0x713016, line: 0xffdf83 },
  { top: 0xffb85a, body: 0xdb5b24, side: 0x8e321b, trim: 0x5f2416, line: 0xffcf74 },
  { top: 0xf4d98c, body: 0xc98c35, side: 0x7a4a1c, trim: 0x543116, line: 0xffe7a1 },
  { top: 0xb5d46c, body: 0x6fa33b, side: 0x3d6427, trim: 0x28451d, line: 0xdff09c },
  { top: 0xf3e4bd, body: 0xd2ab70, side: 0x8c6337, trim: 0x5e4226, line: 0xffefc7 },
  { top: 0x94d4d6, body: 0x2c9aaf, side: 0x166172, trim: 0x0f4652, line: 0xbef3ef },
];

function createBlockView(layer: PixiContainer): BlockView {
  const view = new Container() as BlockView;
  view.art = new Graphics();
  view.addChild(view.art);
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
  options: { active?: boolean; alpha?: number; falling?: boolean } = {}
) {
  const art = view.art;
  const style = BLOCK_STYLES[index % BLOCK_STYLES.length];
  const alpha = options.alpha ?? 1;
  const radius = Math.max(5, Math.min(11, width * 0.05));
  const safeWidth = Math.max(0, width);
  const tileStep = Math.max(28, Math.min(48, safeWidth / 4));
  const inset = Math.min(8, safeWidth * 0.06);

  art.clear();
  art.ellipse(safeWidth / 2, BLOCK_HEIGHT + 10, Math.max(24, safeWidth * 0.48), 9)
    .fill({ color: 0x173447, alpha: options.active ? 0.28 * alpha : 0.2 * alpha });

  art.roundRect(0, 4, safeWidth, BLOCK_HEIGHT - 2, radius)
    .fill({ color: style.side, alpha })
    .stroke({ color: 0x4a230e, width: options.active ? 3 : 2, alpha: 0.55 * alpha });
  art.roundRect(0, 0, safeWidth, BLOCK_HEIGHT - 9, radius)
    .fill({ color: style.body, alpha })
    .stroke({ color: style.trim, width: 2, alpha: 0.78 * alpha });
  art.roundRect(inset, 4, Math.max(0, safeWidth - inset * 2), 9, 5)
    .fill({ color: style.top, alpha: 0.86 * alpha });
  art.rect(0, BLOCK_HEIGHT - 12, safeWidth, 8).fill({ color: style.trim, alpha: 0.22 * alpha });

  for (let x = inset + tileStep; x < safeWidth - inset; x += tileStep) {
    art.moveTo(x, 6);
    art.lineTo(x, BLOCK_HEIGHT - 13);
    art.stroke({ color: style.trim, width: 1.5, alpha: 0.28 * alpha });
  }

  for (let x = inset + 12; x < safeWidth - inset; x += 30) {
    art.moveTo(x, 11);
    art.quadraticCurveTo(x + 11, 20, x + 1, BLOCK_HEIGHT - 14);
    art.stroke({ color: style.line, width: 1.1, alpha: 0.35 * alpha, cap: "round" });
    art.moveTo(x + 10, 9);
    art.lineTo(x + 18, 15);
    art.stroke({ color: 0x6b2f14, width: 1, alpha: 0.18 * alpha, cap: "round" });
  }

  if (options.active) {
    art.roundRect(-5, -5, safeWidth + 10, BLOCK_HEIGHT + 5, radius + 5)
      .stroke({ color: 0xfff1a8, width: 3.5, alpha: 0.82 });
    art.moveTo(width / 2, -22);
    art.lineTo(width / 2 - 9, -8);
    art.lineTo(width / 2 + 9, -8);
    art.closePath();
    art.fill({ color: 0xfff1a8, alpha: 0.82 });
  }

  if (options.falling) {
    art.roundRect(0, 0, safeWidth, BLOCK_HEIGHT - 6, radius)
      .stroke({ color: 0xfff1a8, width: 2.3, alpha: 0.42 * alpha });
  }
}

function applyBlockView(
  view: BlockView,
  x: number,
  y: number,
  width: number,
  index: number,
  options: { active?: boolean; alpha?: number; rotation?: number; falling?: boolean } = {}
) {
  drawBlockArt(view, width, index, options);
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

export function createSpriteRegistry(): SpriteRegistry {
  return {
    blocks: new Map(),
    pieces: new Map(),
    moving: null,
    dropping: null,
    comboText: null,
    perfectHighlight: null,
    crashBird: null,
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
  void textures;

  const activeBlockIds = new Set<string>();
  for (let index = 0; index < state.blocks.length; index += 1) {
    const key = `block-${index}`;
    const block = state.blocks[index];
    const view = ensureBlockView(registry.blocks, key, layer);
    applyBlockView(view, block.x, getBlockY(index, viewportHeight, state.scroll), block.w, index);
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
    applyBlockView(registry.moving, state.mv.x, getMovingBlockY(state, viewportHeight), state.mv.w, nextIndex, { active: true });
  } else if (registry.moving) {
    registry.moving.visible = false;
  }

  registry.dropping = ensureSingleBlockView(registry.dropping, layer);
  if (state.drop) {
    applyBlockView(registry.dropping, state.drop.x, state.drop.y, state.drop.w, nextIndex, { alpha: 0.96, falling: true });
  } else {
    registry.dropping.visible = false;
  }

  const activePieceIds = new Set<string>();
  for (let index = 0; index < state.pieces.length; index += 1) {
    const piece = state.pieces[index];
    const key = `piece-${index}`;
    const view = ensureBlockView(registry.pieces, key, layer);
    applyBlockView(view, piece.x, piece.y, piece.w, Math.max(0, state.blocks.length - 1), {
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
}

export function destroySpriteRegistry(registry: SpriteRegistry) {
  for (const view of registry.blocks.values()) view.destroy({ children: true });
  for (const view of registry.pieces.values()) view.destroy({ children: true });
  registry.moving?.destroy({ children: true });
  registry.dropping?.destroy({ children: true });
  registry.comboText?.destroy();
  registry.perfectHighlight?.destroy();
  registry.crashBird?.destroy({ children: true });
}
