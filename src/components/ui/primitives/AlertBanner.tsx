import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function AlertBanner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("alert-banner", className)} {...props} />;
}
