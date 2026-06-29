import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function PanelFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel-frame", className)} {...props} />;
}
