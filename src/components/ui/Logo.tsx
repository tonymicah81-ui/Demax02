import React from "react";
import { cn } from "../../utils/cn";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  showText = true, 
  size = "md",
  iconOnly = false 
}) => {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16"
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/WA_1776458003470.jpeg"
        alt="Durex Team Logo"
        referrerPolicy="no-referrer"
        className={cn(sizes[size], "w-auto object-contain")}
      />

      {!iconOnly && showText && (
        <div className={cn("font-extrabold tracking-tighter flex items-baseline leading-none uppercase", textSizes[size])}>
          <span className="text-[#22c55e]">Durex</span>
          <span className="text-[#3b82f6] ml-1">Team</span>
        </div>
      )}
    </div>
  );
};
