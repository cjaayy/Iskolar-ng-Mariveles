import React from "react";

/* -- Wavy Separator -- */
export function WavySeparator({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full ${className}`}
      height="20"
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 10 Q150 0, 300 10 Q450 20, 600 10 Q750 0, 900 10 Q1050 20, 1200 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
      />
    </svg>
  );
}
