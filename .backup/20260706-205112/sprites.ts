import { Graphics, Sprite, Text, type Container, Color, Texture } from "pixi.js";
import { getMovingBlockY } from "../../core/core";
import type { GameState } from "../../core/types";
import { BLOCK_HEIGHT } from "../../core/constants";
import { getBlockY } from "../../logic/rules";
import { getBlockTextureWidth, type GameTextures } from "./textures";

export interface SpriteRegistry {
  blocks: Map<string, Sprite>;
  pieces: Map<string, Sprite>;
  piecePool: Sprite[];
  moving: Sprite | null;
  dropping: Sprite | null;
  comboText: Text | null;
  perfectHighlight: Graphics | null;
}

function getBlockTexture(textures: GameTextures, index: number): Texture {
  const list = [
    textures.gach,
    textures.dongrom,
    textures.fuellamp,
    textures.binhtra,
    textures.banhchung,
    textures.nonla
  ];
  return list[index % list.length] || textures.block;
}

function ensureBlockSprite(
  map: Map<string, Sprite>,
  key: string,
  layer: Container,
  textures: GameTextures,
  index: number
): Sprite {
  let sprite = map.get(key);
  const tex = getBlockTexture(textures, index);

  if (!sprite) {
    sprite = new Sprite(tex);
    sprite.anchor.set(0, 0);
    layer.addChild(sprite);
    map.set(key, sprite);
  } else {
    sprite.texture = tex;
  }

  sprite.tint = 0xffffff;

  return sprite;
}

function ensureSingleBlockSprite(
  sprite: Sprite | null,
  layer: Container,
  textures: GameTextures,
  index: number
): Sprite {
  const tex = getBlockTexture(textures, index);

  if (!sprite) {
    sprite = new Sprite(tex);
    sprite.anchor.set(0, 0);
    layer.addChild(sprite);
  } else {
    sprite.texture = tex;
  }

  sprite.tint = 0xffffff;

  return sprite;
}

function applyBlockSprite(sprite: Sprite, x: number, y: number, width: number, alpha = 1) {
  sprite.x = x;
  sprite.y = y;
  sprite.width = width;
  sprite.height = BLOCK_HEIGHT;
  sprite.alpha = alpha;
}

export function createSpriteRegistry(): SpriteRegistry {
  return {
    blocks: new Map(),
    pieces: new Map(),
    piecePool: [],
    moving: null,
    dropping: null,
    comboText: null,
    perfectHighlight: null,
  };
}

export function syncWorldSprites(
  layer: Container,
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
    const sprite = ensureBlockSprite(registry.blocks, key, layer, textures, index);
    applyBlockSprite(sprite, block.x, getBlockY(index, viewportHeight, state.scroll), block.w);
    activeBlockIds.add(key);
  }

  for (const [key, sprite] of registry.blocks.entries()) {
    if (!activeBlockIds.has(key)) {
      sprite.destroy();
      registry.blocks.delete(key);
    }
  }

  const nextColorIndex = state.blocks.length;

  if (state.sub === "moving") {
    registry.moving = ensureSingleBlockSprite(registry.moving, layer, textures, nextColorIndex);
    registry.moving.visible = true;
    applyBlockSprite(registry.moving, state.mv.x, getMovingBlockY(state, viewportHeight), state.mv.w);
  } else if (registry.moving) {
    registry.moving.visible = false;
  }

  registry.dropping = ensureSingleBlockSprite(registry.dropping, layer, textures, nextColorIndex);
  if (state.drop) {
    applyBlockSprite(registry.dropping, state.drop.x, state.drop.y, state.drop.w, 0.96);
    registry.dropping.visible = true;
  } else {
    registry.dropping.visible = false;
  }

  const activePieceIds = new Set<string>();
  for (let index = 0; index < state.pieces.length; index += 1) {
    const piece = state.pieces[index];
    const key = `piece-${index}`;
    const sprite = ensureBlockSprite(registry.pieces, key, layer, textures, Math.max(0, state.blocks.length - 1));
    applyBlockSprite(sprite, piece.x, piece.y, piece.w, piece.alpha);
    sprite.rotation = piece.rot;
    activePieceIds.add(key);
  }

  for (const [key, sprite] of registry.pieces.entries()) {
    if (!activePieceIds.has(key)) {
      sprite.destroy();
      registry.pieces.delete(key);
    }
  }

  if (state.combo > 1) {
    if (!registry.comboText) {
      registry.comboText = new Text({
        text: `Combo x${state.combo}`,
        style: {
          fontFamily: "var(--font-family, system-ui)",
          fontSize: 32,
          fontWeight: "900",
          fill: "#ffffff",
          dropShadow: {
            alpha: 0.3,
            blur: 4,
            color: "#000000",
            distance: 2,
          },
        },
      });
      registry.comboText.anchor.set(0.5);
      registry.comboText.x = appWidth / 2;
      registry.comboText.y = 80;
      layer.addChild(registry.comboText);
    } else {
      registry.comboText.text = `Combo x${state.combo}`;
      registry.comboText.visible = true;
    }
  } else if (registry.comboText) {
    registry.comboText.visible = false;
  }

  if (state.perfectHighlight) {
    if (!registry.perfectHighlight) {
      registry.perfectHighlight = new Graphics();
      layer.addChild(registry.perfectHighlight);
    }
    registry.perfectHighlight.clear();
    const baseH = BLOCK_HEIGHT;
    const progress = 1 - state.perfectHighlight.alpha;
    const h = baseH + progress * 20; 
    const yOffset = -progress * 10;
    
    registry.perfectHighlight.rect(
      state.perfectHighlight.x,
      state.perfectHighlight.y + yOffset,
      state.perfectHighlight.w,
      h
    );
    registry.perfectHighlight.fill({ color: 0xffffff, alpha: Math.max(0, state.perfectHighlight.alpha * 0.7) });
    registry.perfectHighlight.visible = true;
  } else if (registry.perfectHighlight) {
    registry.perfectHighlight.visible = false;
  }
}

export function destroySpriteRegistry(registry: SpriteRegistry) {
  for (const sprite of registry.blocks.values()) sprite.destroy();
  for (const sprite of registry.pieces.values()) sprite.destroy();
  registry.moving?.destroy();
  registry.dropping?.destroy();
  registry.comboText?.destroy();
  registry.perfectHighlight?.destroy();
}
