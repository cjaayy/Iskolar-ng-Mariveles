import React from "react";

/* -- Empty State Illustration -- */
export function EmptyStateIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Paper stack */}
      <rect
        x="55"
        y="30"
        width="90"
        height="110"
        rx="6"
        fill="#F0E6E8"
        transform="rotate(3 100 85)"
      />
      <rect
        x="50"
        y="25"
        width="90"
        height="110"
        rx="6"
        fill="#F7F0F1"
        transform="rotate(-2 95 80)"
      />
      <rect
        x="52"
        y="20"
        width="90"
        height="110"
        rx="6"
        fill="white"
        stroke="#E2D6D8"
        strokeWidth="1.5"
      />

      {/* Lines on paper */}
      <line
        x1="68"
        y1="45"
        x2="126"
        y2="45"
        stroke="#E2D6D8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="68"
        y1="55"
        x2="120"
        y2="55"
        stroke="#E2D6D8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="68"
        y1="65"
        x2="110"
        y2="65"
        stroke="#E2D6D8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="68"
        y1="75"
        x2="115"
        y2="75"
        stroke="#E2D6D8"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Magnifying glass */}
      <circle
        cx="115"
        cy="100"
        r="18"
        fill="none"
        stroke="#4A6FA5"
        strokeWidth="3"
      />
      <line
        x1="128"
        y1="113"
        x2="140"
        y2="125"
        stroke="#4A6FA5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="115" cy="100" r="12" fill="#4A6FA5" opacity="0.05" />

      {/* Question mark */}
      <text
        x="110"
        y="106"
        fontSize="18"
        fill="#4A6FA5"
        fontFamily="Georgia"
        fontWeight="bold"
      >
        ?
      </text>

      {/* Decorative dots */}
      <circle cx="40" cy="40" r="3" fill="#E6B89C" opacity="0.5" />
      <circle cx="165" cy="50" r="2" fill="#4A6FA5" opacity="0.3" />
      <circle cx="35" cy="110" r="2" fill="#F5C026" opacity="0.4" />
      <circle cx="170" cy="130" r="3" fill="#E6B89C" opacity="0.3" />
    </svg>
  );
}
