interface StatRowProps {
  label: string;
  value: string;
  accent?: string;
}

export function StatRow({ label, value, accent }: StatRowProps) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
    </div>
  );
}
