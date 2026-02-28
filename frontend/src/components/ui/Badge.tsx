"use client";

import React from "react";

/* ======================== BADGE ======================== */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: "bg-sage-100 text-sage-500 dark:bg-sage-500/20 dark:text-sage-300",
  warning:
    "bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
  error: "bg-coral-50 text-coral-500 dark:bg-coral-500/20 dark:text-coral-300",
  info: "bg-ocean-50 text-ocean-400 dark:bg-ocean-400/20 dark:text-ocean-200",
  neutral: "bg-muted text-muted-fg",
};

const dotStyles: Record<BadgeVariant, string> = {
  success: "bg-sage-400",
  warning: "bg-amber-400",
  error: "bg-coral-400",
  info: "bg-ocean-400",
  neutral: "bg-muted-fg",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-medium font-body
        ${badgeStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}
