import { useEffect, useRef } from "react";
import type { Application } from "pixi.js";
import { normalizePointer } from "./normalizePointer";

interface UseGameInputOptions {
  app: Application | null;
  enabled: boolean;
  onAction: (intent: { kind: "drag-up" | "tap"; distance: number }) => void;
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

    let activePointerId: number | null = null;
    let startY = 0;
    let lastY = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (!latestEnabledRef.current) return;
      const pointer = normalizePointer(event, canvas.getBoundingClientRect());
      activePointerId = event.pointerId;
      startY = pointer.y;
      lastY = pointer.y;
      canvas.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      const pointer = normalizePointer(event, canvas.getBoundingClientRect());
      lastY = pointer.y;
    };

    const finishPointer = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      if (!latestEnabledRef.current) {
        activePointerId = null;
        return;
      }

      const pointer = normalizePointer(event, canvas.getBoundingClientRect());
      lastY = pointer.y;
      const upwardDistance = Math.max(0, startY - lastY);
      latestOnActionRef.current({
        kind: upwardDistance >= 18 ? "drag-up" : "tap",
        distance: upwardDistance,
      });
      canvas.releasePointerCapture?.(event.pointerId);
      activePointerId = null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", finishPointer);
    canvas.addEventListener("pointercancel", finishPointer);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", finishPointer);
      canvas.removeEventListener("pointercancel", finishPointer);
    };
  }, [app]);
}
