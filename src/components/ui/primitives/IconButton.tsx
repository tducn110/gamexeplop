import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("icon-btn", className)} {...props} />;
}
