import { Assets, Graphics, Rectangle, Texture, type Application } from "pixi.js";

const BLOCK_TEXTURE_WIDTH = 256;
const BLOCK_TEXTURE_HEIGHT = 44;
const BLOCK_SHEET_SVG_ASSET = "/assets/blockrender.svg";
const BLOCK_SHEET_WEBP_ASSET = "/assets/blockrender.webp";
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

export interface AssetDiagnostics {
  status: "loaded_svg" | "loaded_webp" | "fallback_procedural";
  primaryAsset: string;
  fallbackAsset?: string;
  error: string | null;
  texturesCount: number;
  timestamp: number;
}

export function getBlockTextureWidth() {
  return BLOCK_TEXTURE_WIDTH;
}

function createFrameTexture(sheet: Texture, viewBoxFrame: ViewBoxFrame) {
  const scaleX = sheet.width / BLOCK_SHEET_VIEWBOX.width;
  const scaleY = sheet.height / BLOCK_SHEET_VIEWBOX.height;

  const fw = Math.max(1, Math.round(viewBoxFrame.width * scaleX));
  const fh = Math.max(1, Math.round(viewBoxFrame.height * scaleY));
  const fx = Math.min(Math.max(0, sheet.width - fw), Math.max(0, Math.round(viewBoxFrame.x * scaleX)));
  const fy = Math.min(Math.max(0, sheet.height - fh), Math.max(0, Math.round(viewBoxFrame.y * scaleY)));

  return new Texture({
    source: sheet.source,
    frame: new Rectangle(fx, fy, fw, fh),
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

function createProceduralBlockTexture(app: Application, color: number): Texture {
  const g = new Graphics();
  g.roundRect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT, 8);
  g.fill({ color });
  g.roundRect(2, 2, BLOCK_TEXTURE_WIDTH - 4, Math.floor(BLOCK_TEXTURE_HEIGHT * 0.4), 4);
  g.fill({ color: 0xffffff, alpha: 0.35 });
  g.roundRect(0, 0, BLOCK_TEXTURE_WIDTH, BLOCK_TEXTURE_HEIGHT, 8);
  g.stroke({ color: 0x000000, alpha: 0.15, width: 2 });
  const tex = app.renderer.generateTexture(g);
  g.destroy();
  return tex;
}

function recordAssetDiagnostics(diag: AssetDiagnostics) {
  if (typeof window !== "undefined") {
    (window as any).__ASSET_DIAGNOSTICS__ = diag;
  }
  if (diag.status === "fallback_procedural") {
    console.error("[ASSET_TRACKING] All block image assets failed to load! Using procedural vector fallback.", diag);
  } else if (diag.status === "loaded_webp") {
    console.warn("[ASSET_TRACKING] SVG asset failed, fell back to WebP successfully.", diag);
  } else {
    console.info("[ASSET_TRACKING] Block SVG textures loaded successfully.", diag);
  }
}

export async function createGameTextures(app: Application): Promise<GameTextures> {
  const spark = createSparkTexture(app);
  let blockSheet: Texture | null = null;
  let loadStatus: AssetDiagnostics["status"] = "loaded_svg";
  let lastError: string | null = null;

  // 1. Try loading SVG asset
  try {
    blockSheet = await Assets.load<Texture>({
      src: BLOCK_SHEET_SVG_ASSET,
      data: { resolution: 2 },
    });
    if (!blockSheet || !blockSheet.source || blockSheet.width <= 1 || blockSheet.height <= 1) {
      throw new Error(`Invalid SVG dimensions: width=${blockSheet?.width}, height=${blockSheet?.height}`);
    }
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.warn(`[ASSET_TRACKING] Failed to load SVG block sheet (${BLOCK_SHEET_SVG_ASSET}): ${lastError}. Attempting WebP fallback...`);
    blockSheet = null;
  }

  // 2. Fallback to WebP asset
  if (!blockSheet) {
    try {
      blockSheet = await Assets.load<Texture>(BLOCK_SHEET_WEBP_ASSET);
      if (!blockSheet || !blockSheet.source || blockSheet.width <= 1 || blockSheet.height <= 1) {
        throw new Error(`Invalid WebP dimensions: width=${blockSheet?.width}, height=${blockSheet?.height}`);
      }
      loadStatus = "loaded_webp";
    } catch (err: any) {
      const webpError = err?.message || String(err);
      console.warn(`[ASSET_TRACKING] Failed to load WebP block sheet (${BLOCK_SHEET_WEBP_ASSET}): ${webpError}. Using procedural fallback.`);
      lastError = `SVG: ${lastError} | WebP: ${webpError}`;
      blockSheet = null;
    }
  }

  // 3. Fallback to procedural vector textures
  if (!blockSheet) {
    loadStatus = "fallback_procedural";
    const proceduralBlocks = BLOCK_PALETTE.map((color) => createProceduralBlockTexture(app, color));
    recordAssetDiagnostics({
      status: loadStatus,
      primaryAsset: BLOCK_SHEET_SVG_ASSET,
      fallbackAsset: BLOCK_SHEET_WEBP_ASSET,
      error: lastError,
      texturesCount: proceduralBlocks.length,
      timestamp: Date.now(),
    });

    return {
      blockSheet: proceduralBlocks[0],
      block: proceduralBlocks[0],
      blocks: proceduralBlocks,
      spark,
    };
  }

  // Loaded from sprite sheet (SVG or WebP)
  const blocks = BLOCK_FRAMES.map((frame) => createFrameTexture(blockSheet!, frame));

  recordAssetDiagnostics({
    status: loadStatus,
    primaryAsset: BLOCK_SHEET_SVG_ASSET,
    fallbackAsset: loadStatus === "loaded_webp" ? BLOCK_SHEET_WEBP_ASSET : undefined,
    error: lastError,
    texturesCount: blocks.length,
    timestamp: Date.now(),
  });

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
