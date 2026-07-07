import { useEffect, useRef, useState, type CSSProperties } from "react";
interface Props {
  progress: number;
  onDone: () => void;
  completeDelayMs?: number;
  exiting?: boolean;
}

const leafColors = ["#74884f", "#9aac64", "#aebc72", "#d7dfa4", "#f0b840"];

const ambientLeaves = Array.from({ length: 24 }, (_, index) => ({
  left: (index * 37) % 100,
  size: 14 + ((index * 11) % 24),
  fall: 5.1 + ((index * 7) % 50) / 10,
  sway: 1.4 + ((index * 5) % 18) / 10,
  delay: ((index * 13) % 60) / 10,
  drift: (index % 2 === 0 ? 1 : -1) * (22 + ((index * 17) % 92)),
  rot: (index % 2 === 0 ? 1 : -1) * (170 + ((index * 19) % 260)),
  swayX: 10 + ((index * 23) % 36),
  color: leafColors[index % leafColors.length],
}));

const burstLeaves = Array.from({ length: 42 }, (_, index) => {
  const angle = (-172 + (344 / 41) * index) * (Math.PI / 180);
  const distance = 150 + ((index * 29) % 320);
  return {
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance - 88 - ((index * 31) % 130),
    size: 13 + ((index * 17) % 28),
    rotate: (index % 2 === 0 ? 1 : -1) * (260 + ((index * 37) % 600)),
    scale: 0.72 + ((index * 7) % 90) / 100,
    delay: ((index * 3) % 18) / 100,
    color: leafColors[index % leafColors.length],
  };
});

export function LoadingScreen({ progress, onDone, completeDelayMs = 1150, exiting = false }: Props) {
  const [complete, setComplete] = useState(false);
  const completedRef = useRef(false);
  const safeProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (safeProgress < 100 || completedRef.current) return;
    completedRef.current = true;
    setComplete(true);
    const timer = window.setTimeout(onDone, completeDelayMs);
    return () => window.clearTimeout(timer);
  }, [completeDelayMs, safeProgress, onDone]);

  const classNames = [
    "screen-loading",
    complete ? "is-complete" : "",
    exiting ? "is-exiting" : "",
  ].filter(Boolean).join(" ");

  return (
    <section className={classNames} aria-busy={!complete} aria-label="Đang tải mini-game">
      <img className="screen-loading-bg" src="/assets/slashing-fruit-loading.svg" alt="" aria-hidden="true" />

      <div className="leaf-layer" aria-hidden="true">
        {ambientLeaves.map((leaf, index) => (
          <span key={index} className="ambient-leaf" style={{
            left: `${leaf.left}%`, "--w": `${leaf.size}px`, "--fall": `${leaf.fall}s`,
            "--sway": `${leaf.sway}s`, "--delay": `${leaf.delay}s`, "--drift": `${leaf.drift}px`,
            "--rot": `${leaf.rot}deg`, "--sway-x": `${leaf.swayX}px`, "--leaf-color": leaf.color,
          } as CSSProperties} />
        ))}
      </div>
      <div className="burst-layer" aria-hidden="true">
        {burstLeaves.map((leaf, index) => (
          <span key={index} className="burst-leaf" style={{
            "--tx": `${leaf.tx}px`, "--ty": `${leaf.ty}px`, "--w": `${leaf.size}px`,
            "--r": `${leaf.rotate}deg`, "--scale": leaf.scale, "--burst-delay": `${leaf.delay}s`,
            "--leaf-color": leaf.color,
          } as CSSProperties} />
        ))}
      </div>

      <div className="screen-loading-content">
        <div className="loading-progress-area">
          <div className="loading-progress-meta">
            <span className="loading-status">{complete ? "Hoàn tất!" : "Đang chuẩn bị cánh đồng..."}</span>
            <span className="loading-percent">{Math.round(safeProgress)}%</span>
          </div>
          <div className="loading-progress-shell" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safeProgress)}>
            <div className="loading-progress-fill" style={{ width: `${safeProgress}%` }} />
            <div className="loading-progress-tip" style={{ left: `${safeProgress}%` }} aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
