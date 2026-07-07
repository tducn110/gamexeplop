import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { createStageLayers, type StageLayers } from "./containers";
import { getViewSize } from "./resize";

export function usePixiApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const layersRef = useRef<StageLayers | null>(null);
  const sizeRef = useRef({ width: 390, height: 720 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const app = new Application();
    const startSize = getViewSize(wrap);
    sizeRef.current = startSize;

    const resizeObserver = new ResizeObserver(() => {
      if (!appRef.current || !wrapRef.current) return;
      const nextSize = getViewSize(wrapRef.current);
      sizeRef.current = nextSize;
      appRef.current.renderer.resize(nextSize.width, nextSize.height);
    });

    app.init({
      width: startSize.width,
      height: startSize.height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      gcActive: true,
      gcMaxUnusedTime: 60000,
      gcFrequency: 30000,
    }).then(() => {
      if (cancelled) {
        app.destroy({ removeView: true, releaseGlobalResources: true });
        return;
      }

      const layers = createStageLayers();
      layersRef.current = layers;
      app.stage.addChild(layers.root);
      wrap.appendChild(app.canvas);
      Object.assign(app.canvas.style, {
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
      });
      appRef.current = app;
      resizeObserver.observe(wrap);
      setReady(true);
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      app.stage.removeChildren();
      app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
      appRef.current = null;
      layersRef.current = null;
      setReady(false);
    };
  }, []);

  return { wrapRef, appRef, layersRef, sizeRef, ready };
}
