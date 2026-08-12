import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { createStageLayers, type StageLayers } from "./containers";
import { resizeRendererToViewport } from "./resize";
import { useMeasuredViewport } from "@/platform/viewport/useMeasuredViewport";

export function usePixiApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const layersRef = useRef<StageLayers | null>(null);
  const sizeRef = useRef({ width: 390, height: 720 });
  const viewport = useMeasuredViewport(wrapRef);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!viewport.ready) return;

    let cancelled = false;
    let initialized = false;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const app = new Application();
    const startSize = viewport.size;
    sizeRef.current = startSize;

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
      initialized = true;
      if (cancelled) {
        app.destroy({ removeView: true, releaseGlobalResources: true });
        return;
      }

      const layers = createStageLayers();
      layersRef.current = layers;
      app.stage.addChild(layers.root);
      wrap.appendChild(app.canvas);
      resizeRendererToViewport(app, startSize);
      appRef.current = app;
      setReady(true);
    }).catch((error) => {
      console.error("Failed to initialize Pixi application", error);
    });

    return () => {
      cancelled = true;
      if (initialized) {
        app.stage.removeChildren();
        app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
      }
      appRef.current = null;
      layersRef.current = null;
      setReady(false);
    };
  }, [viewport.ready]);

  useEffect(() => {
    if (!ready || !appRef.current || !viewport.ready) return;
    sizeRef.current = viewport.size;
    resizeRendererToViewport(appRef.current, viewport.size);
  }, [ready, viewport.ready, viewport.size.width, viewport.size.height]);

  return { wrapRef, appRef, layersRef, sizeRef, ready, viewport };
}
