import { Graphics, Sprite, Text, type Container } from "pixi.js";
import { getMovingBlockY } from "../../core/core";
import type { GameState } from "../../core/types";
import { BLOCK_HEIGHT } from "../../core/constants";
import { getBlockY } from "../../logic/rules";
import { getBlockTextureWidth, type GameTextures } from "./textures";

export interface SpriteRegistry {
  blocks: Map<string, Sprite>;
  pieces: Map<string, Sprite>;
  moving: Sprite | null;
  dropping: Sprite | null;
  comboText: Text | null;
}

function ensureSprite(map: Map<string, Sprite>, key: string, layer: Container, textures: GameTextures) {
  let sprite = map.get(key);
  if (!sprite) {
    sprite = new Sprite(textures.block);
    sprite.anchor.set(0, 0);
    layer.addChild(sprite);
    map.set(key, sprite);
  }
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
    moving: null,
    dropping: null,
    comboText: null,
  };
}

export function syncWorldSprites(layer: Container, state: GameState, textures: GameTextures, registry: SpriteRegistry, viewportHeight: number, appWidth: number) {
  const activeBlockIds = new Set<string>();
  for (let index = 0; index < state.blocks.length; index += 1) {
    const key = `block-${index}`;
    const block = state.blocks[index];
    const sprite = ensureSprite(registry.blocks, key, layer, textures);
    applyBlockSprite(sprite, block.x, getBlockY(index, viewportHeight, state.scroll), block.w);
    activeBlockIds.add(key);
  }

  for (const [key, sprite] of registry.blocks.entries()) {
    if (!activeBlockIds.has(key)) {
      sprite.destroy();
      registry.blocks.delete(key);
    }
  }

  if (!registry.moving) {
    registry.moving = new Sprite(textures.block);
    layer.addChild(registry.moving);
  }

  if (state.sub === "moving") {
    applyBlockSprite(registry.moving, state.mv.x, getMovingBlockY(state, viewportHeight), state.mv.w, 1);
    registry.moving.visible = true;
  } else {
    registry.moving.visible = false;
  }

  if (!registry.dropping) {
    registry.dropping = new Sprite(textures.block);
    layer.addChild(registry.dropping);
  }

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
    const sprite = ensureSprite(registry.pieces, key, layer, textures);
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

  if (!registry.comboText) {
    registry.comboText = new Text({
      text: "",
      style: {
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: 18,
        fontWeight: "800",
        fill: "#e87432",
      },
    });
    registry.comboText.x = appWidth - 110;
    registry.comboText.y = 18;
    layer.addChild(registry.comboText);
  }
  registry.comboText.text = state.combo >= 2 ? `Combo x${state.combo}` : "";
}

export function destroySpriteRegistry(registry: SpriteRegistry) {
  for (const sprite of registry.blocks.values()) sprite.destroy();
  for (const sprite of registry.pieces.values()) sprite.destroy();
  registry.moving?.destroy();
  registry.dropping?.destroy();
  registry.comboText?.destroy();
}
