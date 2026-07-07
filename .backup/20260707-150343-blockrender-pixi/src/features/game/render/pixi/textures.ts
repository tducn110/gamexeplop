import { Graphics, Sprite, type Application, type Texture } from "pixi.js";

const BLOCK_TEXTURE_WIDTH = 256;
const BLOCK_TEXTURE_HEIGHT = 44;

export const BLOCK_PALETTE = [
  0xf4a261, 0xe76f51, 0xd62828, 0x85182a, 
  0x2a9d8f, 0x21867a, 0x264653, 0x1d3557, 
  0x457b9d, 0x3d5a80, 0x98c1d9, 0xa8dadc
];

export interface GameTextures {
  block: Texture;
  spark: Texture;
  gach: Texture;
  dongrom: Texture;
  fuellamp: Texture;
  binhtra: Texture;
  banhchung: Texture;
  nonla: Texture;
}

export function getBlockTextureWidth() {
  return BLOCK_TEXTURE_WIDTH;
}

export function createGameTextures(app: Application): GameTextures {
  // 1. Fallback White block
  const graphics = new Graphics();
  graphics.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  graphics.fill({ color: 0xffffff });
  graphics.rect(0, 0, BLOCK_TEXTURE_WIDTH, 4);
  graphics.fill({ color: 0xffffff, alpha: 0.5 });
  graphics.rect(0, BLOCK_TEXTURE_HEIGHT - 6, BLOCK_TEXTURE_WIDTH, 6);
  graphics.fill({ color: 0x000000, alpha: 0.15 });
  const block = app.renderer.generateTexture(graphics);
  graphics.destroy();

  // 2. Brick (Gạch)
  const gachG = new Graphics();
  gachG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  gachG.fill({ color: 0xbf5a36 });
  gachG.rect(0, 0, BLOCK_TEXTURE_WIDTH, 3);
  gachG.fill({ color: 0xffffff, alpha: 0.25 });
  gachG.rect(0, BLOCK_TEXTURE_HEIGHT - 4, BLOCK_TEXTURE_WIDTH, 4);
  gachG.fill({ color: 0x000000, alpha: 0.2 });
  gachG.rect(0, BLOCK_TEXTURE_HEIGHT / 2 - 1, BLOCK_TEXTURE_WIDTH, 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  gachG.rect(64, 0, 2, BLOCK_TEXTURE_HEIGHT / 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  gachG.rect(192, 0, 2, BLOCK_TEXTURE_HEIGHT / 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  gachG.rect(128, BLOCK_TEXTURE_HEIGHT / 2, 2, BLOCK_TEXTURE_HEIGHT / 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  gachG.rect(0, BLOCK_TEXTURE_HEIGHT / 2, 2, BLOCK_TEXTURE_HEIGHT / 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  gachG.rect(254, BLOCK_TEXTURE_HEIGHT / 2, 2, BLOCK_TEXTURE_HEIGHT / 2);
  gachG.fill({ color: 0x3a3020, alpha: 0.35 });
  const gach = app.renderer.generateTexture(gachG);
  gachG.destroy();

  // 3. Straw (Rơm)
  const romG = new Graphics();
  romG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  romG.fill({ color: 0xe3a834 });
  const darkStraw = 0x8c5b16;
  const lightStraw = 0xfcd670;
  for (let x = -20; x < BLOCK_TEXTURE_WIDTH; x += 24) {
    romG.moveTo(x, 0);
    romG.lineTo(x + 30, BLOCK_TEXTURE_HEIGHT);
    romG.stroke({ color: darkStraw, width: 1.5, alpha: 0.4 });
  }
  for (let x = -10; x < BLOCK_TEXTURE_WIDTH; x += 32) {
    romG.moveTo(x, 0);
    romG.lineTo(x + 15, BLOCK_TEXTURE_HEIGHT);
    romG.stroke({ color: lightStraw, width: 1.2, alpha: 0.5 });
  }
  romG.rect(BLOCK_TEXTURE_WIDTH / 2 - 8, 0, 16, BLOCK_TEXTURE_HEIGHT);
  romG.fill({ color: 0x6e471b });
  romG.moveTo(BLOCK_TEXTURE_WIDTH / 2 - 8, 11);
  romG.lineTo(BLOCK_TEXTURE_WIDTH / 2 + 8, 11);
  romG.stroke({ color: 0x3d2810, width: 2 });
  romG.moveTo(BLOCK_TEXTURE_WIDTH / 2 - 8, 22);
  romG.lineTo(BLOCK_TEXTURE_WIDTH / 2 + 8, 22);
  romG.stroke({ color: 0x3d2810, width: 2 });
  romG.moveTo(BLOCK_TEXTURE_WIDTH / 2 - 8, 33);
  romG.lineTo(BLOCK_TEXTURE_WIDTH / 2 + 8, 33);
  romG.stroke({ color: 0x3d2810, width: 2 });
  const dongrom = app.renderer.generateTexture(romG);
  romG.destroy();

  // 4. Fire (Lửa/Nến)
  const luaG = new Graphics();
  luaG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  luaG.fill({ color: 0xe87432 });
  luaG.rect(0, 0, BLOCK_TEXTURE_WIDTH, 3);
  luaG.fill({ color: 0xffffff, alpha: 0.25 });
  luaG.rect(0, BLOCK_TEXTURE_HEIGHT - 4, BLOCK_TEXTURE_WIDTH, 4);
  luaG.fill({ color: 0x000000, alpha: 0.2 });
  luaG.rect(40, BLOCK_TEXTURE_HEIGHT - 12, BLOCK_TEXTURE_WIDTH - 80, 8);
  luaG.fill({ color: 0x5c3a21 });
  luaG.moveTo(BLOCK_TEXTURE_WIDTH / 2 - 30, BLOCK_TEXTURE_HEIGHT - 12);
  luaG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH / 2 - 15, 10, BLOCK_TEXTURE_WIDTH / 2, 4);
  luaG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH / 2 + 15, 10, BLOCK_TEXTURE_WIDTH / 2 + 30, BLOCK_TEXTURE_HEIGHT - 12);
  luaG.fill({ color: 0xc23838 });
  luaG.moveTo(BLOCK_TEXTURE_WIDTH / 2 - 15, BLOCK_TEXTURE_HEIGHT - 12);
  luaG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH / 2 - 5, 18, BLOCK_TEXTURE_WIDTH / 2, 12);
  luaG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH / 2 + 5, 18, BLOCK_TEXTURE_WIDTH / 2 + 15, BLOCK_TEXTURE_HEIGHT - 12);
  luaG.fill({ color: 0xf0b840 });
  const fuellamp = app.renderer.generateTexture(luaG);
  luaG.destroy();

  // 5. Ceramic Blue-White (Bình trà)
  const traG = new Graphics();
  traG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  traG.fill({ color: 0xebe7dd });
  traG.rect(0, 0, BLOCK_TEXTURE_WIDTH, 3);
  traG.fill({ color: 0xffffff, alpha: 0.4 });
  traG.rect(0, BLOCK_TEXTURE_HEIGHT - 4, BLOCK_TEXTURE_WIDTH, 4);
  traG.fill({ color: 0x000000, alpha: 0.1 });
  const blueColor = 0x20458a;
  traG.moveTo(10, 22);
  traG.quadraticCurveTo(30, 4, 50, 22);
  traG.quadraticCurveTo(70, 40, 90, 22);
  traG.stroke({ color: blueColor, width: 2, alpha: 0.6 });
  traG.moveTo(BLOCK_TEXTURE_WIDTH - 10, 22);
  traG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH - 30, 4, BLOCK_TEXTURE_WIDTH - 50, 22);
  traG.quadraticCurveTo(BLOCK_TEXTURE_WIDTH - 70, 40, BLOCK_TEXTURE_WIDTH - 90, 22);
  traG.stroke({ color: blueColor, width: 2, alpha: 0.6 });
  traG.circle(BLOCK_TEXTURE_WIDTH / 2, BLOCK_TEXTURE_HEIGHT / 2, 14);
  traG.stroke({ color: blueColor, width: 2, alpha: 0.7 });
  traG.circle(BLOCK_TEXTURE_WIDTH / 2, BLOCK_TEXTURE_HEIGHT / 2, 8);
  traG.fill({ color: blueColor, alpha: 0.5 });
  const binhtra = app.renderer.generateTexture(traG);
  traG.destroy();

  // 6. Bamboo / Bánh chưng
  const chungG = new Graphics();
  chungG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  chungG.fill({ color: 0x5d803c });
  chungG.rect(0, 0, BLOCK_TEXTURE_WIDTH, 3);
  chungG.fill({ color: 0xffffff, alpha: 0.2 });
  chungG.rect(0, BLOCK_TEXTURE_HEIGHT - 4, BLOCK_TEXTURE_WIDTH, 4);
  chungG.fill({ color: 0x000000, alpha: 0.15 });
  chungG.rect(80, 0, 3, BLOCK_TEXTURE_HEIGHT);
  chungG.fill({ color: 0x2e421c });
  chungG.rect(176, 0, 3, BLOCK_TEXTURE_HEIGHT);
  chungG.fill({ color: 0x2e421c });
  chungG.rect(83, 0, 2, BLOCK_TEXTURE_HEIGHT);
  chungG.fill({ color: 0x8dae6c, alpha: 0.4 });
  chungG.rect(179, 0, 2, BLOCK_TEXTURE_HEIGHT);
  chungG.fill({ color: 0x8dae6c, alpha: 0.4 });
  const banhchung = app.renderer.generateTexture(chungG);
  chungG.destroy();

  // 7. Nón lá
  const laG = new Graphics();
  laG.rect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT);
  laG.fill({ color: 0xf2dec4 });
  const ringColor = 0xd1b99b;
  laG.rect(0, 11, BLOCK_TEXTURE_WIDTH, 1.5);
  laG.fill({ color: ringColor });
  laG.rect(0, 22, BLOCK_TEXTURE_WIDTH, 1.5);
  laG.fill({ color: ringColor });
  laG.rect(0, 33, BLOCK_TEXTURE_WIDTH, 1.5);
  laG.fill({ color: ringColor });
  const stitchColor = 0xa88d6c;
  for (let x = 0; x < BLOCK_TEXTURE_WIDTH; x += 16) {
    laG.moveTo(x, 0);
    laG.lineTo(x + 8, 11);
    laG.stroke({ color: stitchColor, width: 1, alpha: 0.5 });
    laG.moveTo(x + 8, 11);
    laG.lineTo(x, 22);
    laG.stroke({ color: stitchColor, width: 1, alpha: 0.5 });
    laG.moveTo(x, 22);
    laG.lineTo(x + 8, 33);
    laG.stroke({ color: stitchColor, width: 1, alpha: 0.5 });
    laG.moveTo(x + 8, 33);
    laG.lineTo(x, 44);
    laG.stroke({ color: stitchColor, width: 1, alpha: 0.5 });
  }
  const nonla = app.renderer.generateTexture(laG);
  laG.destroy();

  // Spark
  const pGraphics = new Graphics();
  pGraphics.circle(16, 16, 16);
  pGraphics.fill({ color: 0xffffff });
  const spark = app.renderer.generateTexture(pGraphics);
  pGraphics.destroy();

  return { block, spark, gach, dongrom, fuellamp, binhtra, banhchung, nonla };
}

export function destroyGameTextures(textures: GameTextures | null) {
  if (!textures) return;
  textures.block.destroy(true);
  textures.spark.destroy(true);
  textures.gach.destroy(true);
  textures.dongrom.destroy(true);
  textures.fuellamp.destroy(true);
  textures.binhtra.destroy(true);
  textures.banhchung.destroy(true);
  textures.nonla.destroy(true);
}

export function destroySpriteTexture(sprite: Sprite) {
  sprite.destroy();
}
