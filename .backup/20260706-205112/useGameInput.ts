import { useEffect, useRef } from "react";
import type { Application } from "pixi.js";
import { normalizePointer } from "./normalizePointer";

interface UseGameInputOptions {
  app: Application | null;
  enabled: boolean;
  onAction: () => void;
}

export function useGameInput({ app, enabled, onAction }: UseGameInputOptions) {
  const latestEnabledRef = useRef(enabled);
  const latestOnActionRef = useRef(onAction);

  useEffect(() => {
    latestEnabledRef.current = enabled;
    latestOnActionRef.current = onAction;
  }, [enabled, onAction]);

  useEffect(() => {
    if (!app) return;
    const canvas = app.canvas;
    if (!canvas) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!latestEnabledRef.current) return;
      normalizePointer(event, canvas.getBoundingClientRect());
      latestOnActionRef.current();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => canvas.removeEventListener("pointerdown", handlePointerDown);
  }, [app]);
}
