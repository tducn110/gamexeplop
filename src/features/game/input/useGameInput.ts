import { useEffect } from "react";
import type { Application } from "pixi.js";
import { normalizePointer } from "./normalizePointer";

interface UseGameInputOptions {
  app: Application | null;
  enabled: boolean;
  onAction: () => void;
}

export function useGameInput({ app, enabled, onAction }: UseGameInputOptions) {
  useEffect(() => {
    if (!app) return;
    const canvas = app.canvas;
    if (!canvas) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!enabled) return;
      normalizePointer(event, canvas.getBoundingClientRect());
      onAction();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => canvas.removeEventListener("pointerdown", handlePointerDown);
  }, [app, enabled, onAction]);
}
