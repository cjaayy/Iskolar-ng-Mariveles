"use client";

import React from "react";
import { Spinner } from "./Spinner";

/* ======================== BUTTON ======================== */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-ocean-400 text-white hover:bg-ocean-500 active:bg-ocean-600 shadow-soft hover:shadow-glow focus-visible:ring-2 focus-visible:ring-ocean-300",
  secondary:
    "bg-peach-100 text-ocean-700 hover:bg-peach-200 active:bg-peach-300 dark:bg-peach-300/20 dark:text-peach-200 dark:hover:bg-peach-300/30",
  ghost:
    "bg-transparent text-foreground hover:bg-muted active:bg-card-border dark:hover:bg-muted",
  danger:
    "bg-coral-400 text-white hover:bg-coral-500 active:bg-coral-500 shadow-soft",
  outline:
    "bg-transparent border-2 border-ocean-400 text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-400/10 active:bg-ocean-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-body font-medium
        transition-all duration-200 ease-out
        transform active:scale-[0.97] hover:scale-[1.02]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
