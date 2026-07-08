import { Container, Graphics, Sprite, Text, Texture, type Container as PixiContainer } from "pixi.js";
import { getMovingBlockY } from "../../core/core";
import type { GameState } from "../../core/types";
import { BLOCK_HEIGHT } from "../../core/constants";
import { getBlockY } from "../../logic/rules";
import type { GameTextures } from "./textures";

type BlockView = Container & {
  shadow: Graphics;
  clip: Graphics;
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

}

function fitSpriteByCrop(sprite: Sprite, clip: Graphics, targetWidth: number, referenceWidth: number) {
  const textureWidth = Math.max(1, sprite.texture.width);
  const textureHeight = Math.max(1, sprite.texture.height);
  const scale = referenceWidth / textureWidth;
  
  const renderWidth = textureWidth * scale;
  const renderHeight = textureHeight * scale;
  const cropWidth = Math.max(0, targetWidth);
  const offsetX = (cropWidth - renderWidth) / 2;

  sprite.scale.set(scale);
  sprite.position.set(offsetX, BLOCK_HEIGHT - renderHeight);
  clip.clear();
  clip.rect(0, sprite.y - 10, cropWidth, renderHeight + 20).fill({ color: 0xffffff, alpha: 1 });

  return { width: cropWidth, height: renderHeight, x: 0, y: sprite.y };
}

function createBlockView(layer: PixiContainer): BlockView {
  const view = new Container() as BlockView;
  view.shadow = new Graphics();
  view.clip = new Graphics();
  view.sprite = new Sprite(Texture.EMPTY);
  view.art = new Graphics();
  view.sprite.anchor.set(0, 0);
  view.sprite.mask = view.clip;
  view.addChild(view.shadow, view.sprite, view.art, view.clip);
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

const CANDY_COLORS = [
  0xffb3ba, // Pastel Pink
  0xffdfba, // Pastel Orange
  0xffffba, // Pastel Yellow
  0xbaffc9, // Pastel Green
  0xbae1ff, // Pastel Blue
  0xe8baff, // Pastel Purple
];

function drawBlockArt(
  view: BlockView,
  width: number,
  referenceWidth: number,
  textures: GameTextures,
  options: { active?: boolean; alpha?: number; falling?: boolean; index?: number } = {}
) {
  const shadow = view.shadow;
  const sprite = view.sprite;
  const art = view.art;
  const alpha = options.alpha ?? 1;
  const safeWidth = Math.max(0, width);
  
  shadow.clear();
  art.clear();

  if (safeWidth <= 0) {
    sprite.visible = false;
    return;
  }

  const radius = Math.max(7, Math.min(13, safeWidth * 0.05));
  
  // Choose random texture based on index (index is deterministic for a given block height/piece)
  const textureIndex = (options.index ?? 0) % textures.blocks.length;
  sprite.texture = textures.blocks[textureIndex] || Texture.EMPTY;
  sprite.alpha = alpha;
  sprite.visible = true;

  // Use fitSpriteByCrop to proportionally scale and crop the sprite without stretching
  fitSpriteByCrop(sprite, view.clip, safeWidth, referenceWidth);

  // Simple shadow bottom
  shadow.ellipse(safeWidth / 2, BLOCK_HEIGHT + 4, Math.max(20, safeWidth * 0.45), 7)
    .fill({ color: 0x173447, alpha: options.active ? 0.28 * alpha : 0.2 * alpha });

  if (options.active) {
    // Active outline removed as requested
  }

  if (options.falling) {
    // Optionally add some falling effects here
  }
}

function applyBlockView(
  view: BlockView,
  x: number,
  y: number,
  width: number,
  referenceWidth: number,
  textures: GameTextures,
  options: { active?: boolean; alpha?: number; rotation?: number; falling?: boolean; index?: number } = {}
) {
  drawBlockArt(view, width, referenceWidth, textures, options);
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

export function createSpriteRegistry(): SpriteRegistry {
  return {
    blocks: new Map(),
    pieces: new Map(),
    moving: null,
    dropping: null,
    comboText: null,
    perfectHighlight: null,

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
  const referenceWidth = state.blocks[0]?.w ?? state.mv.w;
  const activeBlockIds = new Set<string>();
  for (let index = 0; index < state.blocks.length; index += 1) {
    const key = `block-${index}`;
    const block = state.blocks[index];
    const view = ensureBlockView(registry.blocks, key, layer);
    applyBlockView(view, block.x, getBlockY(index, viewportHeight, state.scroll), block.w, referenceWidth, textures, { index });
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
    applyBlockView(registry.moving, state.mv.x, getMovingBlockY(state, viewportHeight), state.mv.w, referenceWidth, textures, { active: true, index: nextIndex });
  } else if (registry.moving) {
    registry.moving.visible = false;
  }

  registry.dropping = ensureSingleBlockView(registry.dropping, layer);
  if (state.drop) {
    applyBlockView(registry.dropping, state.drop.x, state.drop.y, state.drop.w, referenceWidth, textures, { alpha: 0.96, falling: true, index: nextIndex });
  } else {
    registry.dropping.visible = false;
  }

  const activePieceIds = new Set<string>();
  for (let index = 0; index < state.pieces.length; index += 1) {
    const piece = state.pieces[index];
    const key = `piece-${index}`;
    const view = ensureBlockView(registry.pieces, key, layer);
    applyBlockView(view, piece.x, piece.y, piece.w, referenceWidth, textures, {
      alpha: piece.alpha,
      rotation: piece.rot,
      falling: true,
      index: index,
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

}

export function destroySpriteRegistry(registry: SpriteRegistry) {
  for (const view of registry.blocks.values()) view.destroy({ children: true });
  for (const view of registry.pieces.values()) view.destroy({ children: true });
  registry.moving?.destroy({ children: true });
  registry.dropping?.destroy({ children: true });
  registry.comboText?.destroy();
  registry.perfectHighlight?.destroy();

}
