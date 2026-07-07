import type { PropsWithChildren } from "react";
import { BackgroundScreen } from "@/screens/BackgroundScreen";

export function GameShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <BackgroundScreen />
      <div className="shell-inner">{children}</div>
    </div>
  );
}
