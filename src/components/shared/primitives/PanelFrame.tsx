import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import gsap from "gsap";

interface PanelFrameProps {
  title: React.ReactNode;
  width?: number;
  maxHeight?: string;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function PanelFrame({
  title,
  width = 340,
  maxHeight,
  onClose,
  className = "",
  style,
  children,
}: PanelFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (frameRef.current) {
      gsap.fromTo(frameRef.current,
        { y: 30, opacity: 0, scale: 0.95, filter: "blur(4px)" },
        { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }
      );
    }
  }, []);

  return (
    <div ref={frameRef} className={className} style={{
      position: "absolute", top: 12, right: 12,
      background: "rgba(255, 250, 240, 0.92)",
      border: "1.5px solid rgba(42, 36, 24, 0.12)",
      borderRadius: 24,
      padding: "24px",
      width,
      maxWidth: "calc(100vw - 24px)",
      maxHeight,
      overflowY: maxHeight ? "auto" : undefined,
      boxShadow: "0 24px 64px rgba(42,36,24,0.18), 0 2px 0 rgba(255, 255, 255, 0.7) inset",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      fontFamily: "var(--font-family)",
      zIndex: 20,
      willChange: "transform, opacity",
      ...style,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontWeight: 900, fontSize: 17, color: "var(--ink-dark)" }}>{title}</span>
        <button
          aria-label="Đóng"
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(138, 125, 101, 0.1)",
            border: "none",
            color: "var(--ink-dark)",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(138, 125, 101, 0.2)";
            e.currentTarget.style.transform = "scale(0.96)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(138, 125, 101, 0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>
      {children}
    </div>
  );
}
