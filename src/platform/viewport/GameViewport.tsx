import type { ReactNode } from "react";
import { useRef } from "react";
import { useMeasuredViewport, type MeasuredViewport } from "./useMeasuredViewport";

interface GameViewportProps {
  className?: string;
  ariaLabel?: string;
  children: (viewport: MeasuredViewport) => ReactNode;
}

export function GameViewport({ className, ariaLabel, children }: GameViewportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewport = useMeasuredViewport(ref);

  return (
    <div ref={ref} className={className} aria-label={ariaLabel}>
      {children(viewport)}
    </div>
  );
}
