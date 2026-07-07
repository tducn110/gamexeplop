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
  { top: 0xf6c764, body: 0xdb9430, side: 0x9f6420, line: 0x7d4c18 },
  { top: 0xf18f68, body: 0xc95d3f, side: 0x7f352b, line: 0x5c2820 },
  { top: 0xd9c994, body: 0x9f7f4f, side: 0x6b4e31, line: 0x4c3622 },
  { top: 0xbad07d, body: 0x6f9b4e, side: 0x3e6336, line: 0x2d4828 },
  { top: 0xf5e6c7, body: 0xd2b48b, side: 0x927356, line: 0x70533c },
  { top: 0x9bc8d8, body: 0x4b94a8, side: 0x2e6170, line: 0x244b56 },
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

  art.clear();
  art.ellipse(width / 2, BLOCK_HEIGHT + 9, Math.max(20, width * 0.46), 8)
    .fill({ color: 0x233044, alpha: options.active ? 0.24 * alpha : 0.16 * alpha });
  art.roundRect(0, 3, width, BLOCK_HEIGHT - 3, radius)
    .fill({ color: style.side, alpha })
    .stroke({ color: 0x2a2418, width: options.active ? 2.6 : 1.5, alpha: 0.34 * alpha });
  art.roundRect(0, 0, width, BLOCK_HEIGHT - 8, radius)
    .fill({ color: style.body, alpha })
    .stroke({ color: 0xffffff, width: 1.2, alpha: 0.28 * alpha });
  art.roundRect(6, 4, Math.max(0, width - 12), 8, 5).fill({ color: style.top, alpha: 0.8 * alpha });
  art.rect(0, BLOCK_HEIGHT - 10, width, 6).fill({ color: 0x2a2418, alpha: 0.13 * alpha });

  for (let x = 18; x < width - 10; x += 26) {
    art.moveTo(x, 7);
    art.lineTo(x + 10, BLOCK_HEIGHT - 12);
    art.stroke({ color: style.line, width: 1.2, alpha: 0.22 * alpha });
  }

  if (options.active) {
    art.roundRect(-4, -4, width + 8, BLOCK_HEIGHT + 4, radius + 5)
      .stroke({ color: 0xfff1a8, width: 3, alpha: 0.75 });
    art.moveTo(width / 2, -22);
    art.lineTo(width / 2 - 9, -8);
    art.lineTo(width / 2 + 9, -8);
    art.closePath();
    art.fill({ color: 0xfff1a8, alpha: 0.82 });
  }

  if (options.falling) {
    art.roundRect(0, 0, width, BLOCK_HEIGHT - 6, radius)
      .stroke({ color: 0xfff1a8, width: 2, alpha: 0.35 * alpha });
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
