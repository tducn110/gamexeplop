import { Graphics, Sprite, type Application, type Texture } from "pixi.js";

const BLOCK_TEXTURE_WIDTH = 256;
const BLOCK_TEXTURE_HEIGHT = 44;

export interface GameTextures {
  block: Texture;
}

export function getBlockTextureWidth() {
  return BLOCK_TEXTURE_WIDTH;
}

export function createGameTextures(app: Application): GameTextures {
  const block = new Graphics();
  block.roundRect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT, 8);
  block.fill({
    color: 0xf0b840,
  });
  block.stroke({
    color: 0x5b3c10,
    alpha: 0.35,
    width: 2,
  });

  for (const ratio of [0.33, 0.67]) {
    const ropeX = BLOCK_TEXTURE_WIDTH * ratio;
    block.rect(ropeX - 3, 3, 6, BLOCK_TEXTURE_HEIGHT - 6);
  }
  block.fill({ color: 0x3a5020, alpha: 0.82 });

  const texture = app.renderer.generateTexture(block);
  block.destroy();
  return { block: texture };
}

export function destroyGameTextures(textures: GameTextures | null) {
  if (!textures) return;
  textures.block.destroy(true);
}

export function destroySpriteTexture(sprite: Sprite) {
  sprite.destroy();
}
