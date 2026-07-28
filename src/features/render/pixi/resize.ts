import type { Application } from "pixi.js";
import type { ViewportSize } from "@/platform/viewport/useMeasuredViewport";

export function isUsableViewport(size: ViewportSize) {
  return size.width >= 1 && size.height >= 1;
}

export function resizeRendererToViewport(app: Application, size: ViewportSize) {
  if (!isUsableViewport(size)) return false;

  app.renderer.resize(size.width, size.height);
  Object.assign(app.canvas.style, {
    width: `${size.width}px`,
    height: `${size.height}px`,
    display: "block",
    touchAction: "none",
  });

  return true;
}
