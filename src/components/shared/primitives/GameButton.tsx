import React from "react";

export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function GameButton({ 
  children, 
  className = "", 
  variant = "primary",
  size = "md",
  style, 
  ...props 
}: GameButtonProps) {
  const btnClass = `game-btn game-btn-${variant} game-btn-${size} ${className}`.trim();
  
  return (
    <button className={btnClass} style={style} {...props}>
      {children}
    </button>
  );
}
