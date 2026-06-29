import { useEffect, useState } from "react";

interface FloatingTextLayerProps {
  callout: {
    id: number;
    message: string;
    tone: "perfect" | "good" | "base";
    combo: number;
  } | null;
}

export function FloatingTextLayer({ callout }: FloatingTextLayerProps) {
  const [visible, setVisible] = useState(callout);

  useEffect(() => {
    if (!callout) return;
    setVisible(callout);
    const timeout = window.setTimeout(() => setVisible(null), 1100);
    return () => window.clearTimeout(timeout);
  }, [callout]);

  if (!visible) return null;

  return (
    <div className={`floating-callout floating-${visible.tone}`}>
      <strong>{visible.message}</strong>
      {visible.combo >= 2 ? <span>Combo x{visible.combo}</span> : null}
    </div>
  );
}
