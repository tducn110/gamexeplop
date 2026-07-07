interface CountdownOverlayProps {
  countdown: number | null;
}

export function CountdownOverlay({ countdown }: CountdownOverlayProps) {
  if (countdown === null) return null;

  return (
    <div className="countdownOverlay">
      <div className="countdownNumber">{countdown}</div>
    </div>
  );
}
