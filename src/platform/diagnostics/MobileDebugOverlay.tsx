import { useEffect, useMemo, useState } from "react";
import type { ViewportDiagnostics } from "@/platform/viewport/useMeasuredViewport";
import { audioManager } from "@/utils/audio-manager";

interface MobileDebugOverlayProps {
  viewport: ViewportDiagnostics;
  renderer: { width: number; height: number } | null;
}

function diagnosticsEnabled() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("debugPlatform") || window.localStorage.getItem("gamePlatformDebug") === "1";
}

export function MobileDebugOverlay({ viewport, renderer }: MobileDebugOverlayProps) {
  const enabled = useMemo(diagnosticsEnabled, []);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => forceUpdate((value) => value + 1), 500);
    return () => window.clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const audio = audioManager.getDiagnostics();

  return (
    <div className="mobile-debug-overlay" aria-hidden="true">
      <div>Viewport: {viewport.width} x {viewport.height}</div>
      <div>Visual: {viewport.visualViewportWidth ?? "-"} x {viewport.visualViewportHeight ?? "-"}</div>
      <div>Host: {Math.floor(viewport.hostWidth)} x {Math.floor(viewport.hostHeight)}</div>
      <div>Renderer: {renderer ? `${renderer.width} x ${renderer.height}` : "-"}</div>
      <div>DPR: {viewport.dpr.toFixed(2)}</div>
      <div>Audio: {audio.unlockState}</div>
      <div>BGM: {audio.bgmPlaying ? "playing" : "stopped"}</div>
      <div>Visibility: {audio.visibilityState}</div>
      {viewport.reason ? <div>{viewport.reason}</div> : null}
    </div>
  );
}
