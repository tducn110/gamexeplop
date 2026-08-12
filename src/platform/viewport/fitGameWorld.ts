import type { ViewportSize } from "./useMeasuredViewport";

export interface FitGameWorldResult extends ViewportSize {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function fitGameWorld(
  viewport: ViewportSize,
  design: ViewportSize,
): FitGameWorldResult {
  const scale = Math.min(viewport.width / design.width, viewport.height / design.height);
  const width = Math.floor(design.width * scale);
  const height = Math.floor(design.height * scale);

  return {
    width,
    height,
    scale,
    offsetX: Math.floor((viewport.width - width) / 2),
    offsetY: Math.floor((viewport.height - height) / 2),
  };
}
