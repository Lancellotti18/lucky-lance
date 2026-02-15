"use client";

import { cn } from "@/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-casino-black",
          // Variant styles
          variant === "primary" &&
            "bg-casino-red text-white hover:bg-casino-red-glow focus:ring-casino-red shadow-[0_0_15px_rgba(220,38,38,0.3)]",
          variant === "secondary" &&
            "border-2 border-casino-red text-casino-red hover:bg-casino-red/10 focus:ring-casino-red",
          variant === "ghost" &&
            "text-casino-muted hover:text-casino-text hover:bg-white/5 focus:ring-white/20",
          variant === "danger" &&
            "bg-red-700 text-white hover:bg-red-600 focus:ring-red-500",
          // Size styles
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-5 py-2.5 text-base",
          size === "lg" && "px-8 py-3.5 text-lg",
          // Full width
          fullWidth && "w-full",
          // Disabled
          disabled && "opacity-50 cursor-not-allowed active:scale-100",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
