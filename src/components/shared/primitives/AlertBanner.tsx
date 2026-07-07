import React from "react";

interface AlertBannerProps {
  variant: "error" | "info" | "success" | "warning";
  children: React.ReactNode;
}

export function AlertBanner({ variant, children }: AlertBannerProps) {
  const styles = {
    error: {
      background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
      border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
      color: "var(--destructive)",
    },
    info: {
      background: "color-mix(in srgb, var(--primary) 8%, transparent)",
      border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
      color: "var(--primary)",
    },
    success: {
      background: "color-mix(in srgb, var(--mascot-green, #4CAF50) 8%, transparent)",
      border: "1px solid color-mix(in srgb, var(--mascot-green, #4CAF50) 25%, transparent)",
      color: "var(--mascot-green, #4CAF50)",
    },
    warning: {
      background: "color-mix(in srgb, var(--mascot-yellow, #FFC107) 8%, transparent)",
      border: "1px solid color-mix(in srgb, var(--mascot-yellow, #FFC107) 25%, transparent)",
      color: "var(--mascot-yellow, #FFC107)",
    }
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <div style={{
      marginTop: 12,
      padding: "10px 14px",
      borderRadius: 10,
      background: currentStyle.background,
      border: currentStyle.border,
      fontSize: 12,
      color: currentStyle.color,
      lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}
