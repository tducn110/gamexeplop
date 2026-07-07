import { Application } from "pixi.js";
import { audioManager } from "./audio-manager";

type ProgressCallback = (progress: number) => void;

const AUDIO_WEIGHT = 0.7;
const IMAGE_WEIGHT = 0.1;
const PIXI_WEIGHT = 0.15;
const FONT_WEIGHT = 0.05;
const MIN_LOADING_MS = 1200;
let preloadPromise: Promise<void> | null = null;

async function preloadFont(): Promise<void> {
  if (!("fonts" in document)) return;
  await Promise.all([
    document.fonts.load('400 16px "Be Vietnam Pro"'),
    document.fonts.load('700 16px "Be Vietnam Pro"'),
    document.fonts.load('800 16px "Be Vietnam Pro"'),
  ]);
  await document.fonts.ready;
}

async function preloadImage(src: string): Promise<void> {
  const image = new Image();
  image.src = src;
  await image.decode();
}

async function warmUpPixiRenderer(): Promise<void> {
  const app = new Application();
  await app.init({ width: 1, height: 1, backgroundAlpha: 0, antialias: true, resolution: 1 });
  app.destroy(true, { children: true });
}

/** Preloads every network/runtime dependency needed before the first app screen. */
export function preloadGameResources(onProgress: ProgressCallback): Promise<void> {
  if (preloadPromise) return preloadPromise;
  const startedAt = performance.now();

  let audioProgress = 0;
  let imageReady = 0;
  let pixiReady = 0;
  let fontReady = 0;
  const report = () => onProgress(Math.min(94, Math.round(
    (audioProgress * AUDIO_WEIGHT + imageReady * IMAGE_WEIGHT + pixiReady * PIXI_WEIGHT + fontReady * FONT_WEIGHT) * 100,
  )));

  onProgress(0);
  preloadPromise = Promise.all([
    audioManager.preloadAll("/assets/", (ratio) => {
      audioProgress = ratio;
      report();
    }),
    preloadImage("/assets/slashing-fruit-loading.svg").then(() => {
      imageReady = 1;
      report();
    }),
    warmUpPixiRenderer().then(() => {
      pixiReady = 1;
      report();
    }),
    preloadFont().then(() => {
      fontReady = 1;
      report();
    }),
  ]).then(async () => {
    const remaining = MIN_LOADING_MS - (performance.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }
    onProgress(100);
  }).catch((error) => {
    preloadPromise = null;
    throw error;
  });

  return preloadPromise;
}
