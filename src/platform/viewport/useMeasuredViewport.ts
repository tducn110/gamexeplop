import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportDiagnostics extends ViewportSize {
  dpr: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
  hostWidth: number;
  hostHeight: number;
  ready: boolean;
  reason: string | null;
}

export interface MeasuredViewport {
  size: ViewportSize;
  diagnostics: ViewportDiagnostics;
  ready: boolean;
}

const MIN_VIEWPORT_PX = 1;
const DEFAULT_VIEWPORT: ViewportSize = { width: 390, height: 720 };

function readDiagnostics(element: HTMLElement | null): ViewportDiagnostics {
  const rect = element?.getBoundingClientRect();
  const hostWidth = rect?.width ?? 0;
  const hostHeight = rect?.height ?? 0;
  const width = Math.floor(hostWidth);
  const height = Math.floor(hostHeight);
  const visualViewport = window.visualViewport;
  const ready = width >= MIN_VIEWPORT_PX && height >= MIN_VIEWPORT_PX;

  return {
    width,
    height,
    dpr: window.devicePixelRatio || 1,
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight,
    visualViewportWidth: visualViewport ? Math.floor(visualViewport.width) : null,
    visualViewportHeight: visualViewport ? Math.floor(visualViewport.height) : null,
    hostWidth,
    hostHeight,
    ready,
    reason: ready ? null : `Invalid viewport ${width}x${height}`,
  };
}

function publishVisualViewportVars(diagnostics: ViewportDiagnostics) {
  const height = diagnostics.visualViewportHeight ?? diagnostics.windowInnerHeight;
  const width = diagnostics.visualViewportWidth ?? diagnostics.windowInnerWidth;
  document.documentElement.style.setProperty("--game-visual-viewport-height", `${height}px`);
  document.documentElement.style.setProperty("--game-visual-viewport-width", `${width}px`);
}

export function useMeasuredViewport<TElement extends HTMLElement>(
  ref: RefObject<TElement>,
): MeasuredViewport {
  const [diagnostics, setDiagnostics] = useState<ViewportDiagnostics>(() => ({
    ...DEFAULT_VIEWPORT,
    dpr: 1,
    windowInnerWidth: DEFAULT_VIEWPORT.width,
    windowInnerHeight: DEFAULT_VIEWPORT.height,
    visualViewportWidth: null,
    visualViewportHeight: null,
    hostWidth: DEFAULT_VIEWPORT.width,
    hostHeight: DEFAULT_VIEWPORT.height,
    ready: false,
    reason: "Viewport not measured",
  }));

  const measure = useCallback(() => {
    const next = readDiagnostics(ref.current);
    publishVisualViewportVars(next);
    setDiagnostics((current) => {
      if (
        current.width === next.width &&
        current.height === next.height &&
        current.dpr === next.dpr &&
        current.windowInnerWidth === next.windowInnerWidth &&
        current.windowInnerHeight === next.windowInnerHeight &&
        current.visualViewportWidth === next.visualViewportWidth &&
        current.visualViewportHeight === next.visualViewportHeight &&
        current.ready === next.ready &&
        current.reason === next.reason
      ) {
        return current;
      }
      return next;
    });
  }, [ref]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [measure, ref]);

  return {
    size: diagnostics.ready
      ? { width: diagnostics.width, height: diagnostics.height }
      : DEFAULT_VIEWPORT,
    diagnostics,
    ready: diagnostics.ready,
  };
}
