"use client";

import React from "react";

/* ======================== CARD ======================== */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const cardPadding = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-card-bg border border-card-border rounded-2xl shadow-soft
        ${hover ? "transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer" : ""}
        ${cardPadding[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
