import type { PropsWithChildren } from "react";

export function GameShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <div className="backdrop-ink" />
      <div className="shell-inner">{children}</div>
    </div>
  );
}
