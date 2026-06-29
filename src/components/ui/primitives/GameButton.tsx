import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "game-btn game-btn-primary",
  secondary: "game-btn game-btn-secondary",
  ghost: "game-btn game-btn-ghost",
};

const sizeClasses: Record<Size, string> = {
  sm: "game-btn-sm",
  md: "game-btn-md",
  lg: "game-btn-lg",
};

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(function GameButton(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return <button ref={ref} className={cn(variantClasses[variant], sizeClasses[size], className)} {...props} />;
});
