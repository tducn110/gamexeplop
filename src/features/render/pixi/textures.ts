import { Assets, Graphics, Rectangle, Texture, type Application } from "pixi.js";

const BLOCK_TEXTURE_WIDTH = 256;
const BLOCK_TEXTURE_HEIGHT = 44;
const BLOCK_SHEET_ASSET = "/assets/blockrender.webp";
const BLOCK_SHEET_VIEWBOX = { width: 1440, height: 810 };

type ViewBoxFrame = { x: number; y: number; width: number; height: number };

const BLOCK_FRAMES: ViewBoxFrame[] = [
  { x: 520, y: 291, width: 84, height: 45 },
  { x: 600, y: 291, width: 82, height: 45 },
  { x: 681, y: 291, width: 78, height: 45 },
  { x: 756, y: 291, width: 80, height: 45 },
  { x: 835, y: 291, width: 80, height: 45 },
  { x: 520, y: 348, width: 84, height: 45 },
  { x: 600, y: 348, width: 82, height: 45 },
  { x: 681, y: 348, width: 78, height: 45 },
  { x: 756, y: 348, width: 80, height: 45 },
  { x: 835, y: 348, width: 80, height: 45 },
  { x: 520, y: 406, width: 84, height: 45 },
  { x: 600, y: 406, width: 82, height: 45 },
  { x: 681, y: 406, width: 78, height: 45 },
  { x: 756, y: 406, width: 80, height: 45 },
  { x: 835, y: 406, width: 80, height: 45 },
  { x: 520, y: 466, width: 84, height: 45 },
  { x: 600, y: 466, width: 82, height: 45 },
  { x: 681, y: 466, width: 78, height: 45 },
  { x: 756, y: 466, width: 80, height: 45 },
  { x: 835, y: 466, width: 80, height: 45 },
];

export const BLOCK_PALETTE = [
  0xf4a261, 0xe76f51, 0xd62828, 0x85182a,
  0x2a9d8f, 0x21867a, 0x264653, 0x1d3557,
  0x457b9d, 0x3d5a80, 0x98c1d9, 0xa8dadc,
];

export interface GameTextures {
  blockSheet: Texture;
  block: Texture;
  blocks: Texture[];
  spark: Texture;
}

export function getBlockTextureWidth() {
  return BLOCK_TEXTURE_WIDTH;
}

function createFrameTexture(sheet: Texture, viewBoxFrame: ViewBoxFrame) {
  const scaleX = sheet.width / BLOCK_SHEET_VIEWBOX.width;
  const scaleY = sheet.height / BLOCK_SHEET_VIEWBOX.height;

  return new Texture({
    source: sheet.source,
    frame: new Rectangle(
      Math.round(viewBoxFrame.x * scaleX),
      Math.round(viewBoxFrame.y * scaleY),
      Math.round(viewBoxFrame.width * scaleX),
      Math.round(viewBoxFrame.height * scaleY)
    ),
  });
}

function createSparkTexture(app: Application) {
  const pGraphics = new Graphics();
  pGraphics.circle(16, 16, 16);
  pGraphics.fill({ color: 0xffffff });
  const spark = app.renderer.generateTexture(pGraphics);
  pGraphics.destroy();
  return spark;
}

export async function createGameTextures(app: Application): Promise<GameTextures> {
  const blockSheet = await Assets.load<Texture>({
    src: BLOCK_SHEET_ASSET,
    data: { resolution: 2 } // Load SVG at 2x resolution for sharpness without breaking 4096px WebGL limits
  });
  const blocks = BLOCK_FRAMES.map((frame) => createFrameTexture(blockSheet, frame));
  const spark = createSparkTexture(app);

  return {
    blockSheet,
    block: blocks[0] ?? blockSheet,
    blocks: blocks.length ? blocks : [blockSheet],
    spark,
  };
}

export function destroyGameTextures(textures: GameTextures | null) {
  if (!textures) return;
  for (const texture of textures.blocks) {
    texture.destroy(false);
  }
  textures.spark.destroy(true);
  textures.blockSheet.destroy(true);
}
