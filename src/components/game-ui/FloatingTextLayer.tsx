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
    <div className="feedbackTextLayer">
      <div className={`pointText ${visible.tone === 'perfect' ? 'criticalText' : visible.combo >= 2 ? 'comboFloatText' : ''}`} style={{ 
        position: 'absolute', top: '50%', left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: visible.tone === 'perfect' ? '#ff9800' : visible.tone === 'good' ? '#8bc34a' : '#ffffff',
        textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)"
      }}>
        {visible.message}
        {visible.combo >= 2 ? ` - Combo x${visible.combo}` : ""}
      </div>
    </div>
  );
}
