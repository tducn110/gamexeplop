import React from "react";

interface StatRowProps {
  label: string;
  value: React.ReactNode;
}

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: "color-mix(in srgb, var(--ink-dark) 70%, transparent)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--ink-dark)" }}>{value}</span>
    </div>
  );
}
