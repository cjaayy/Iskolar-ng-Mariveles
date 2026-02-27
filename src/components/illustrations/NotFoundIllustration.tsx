import React from "react";

/* -- 404 Illustration -- */
export function NotFoundIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      width="300"
      height="220"
      viewBox="0 0 300 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Big "404" */}
      <text
        x="40"
        y="130"
        fontSize="90"
        fontFamily="Georgia"
        fontWeight="bold"
        fill="#E2D6D8"
      >
        4
      </text>
      <text
        x="200"
        y="130"
        fontSize="90"
        fontFamily="Georgia"
        fontWeight="bold"
        fill="#E2D6D8"
      >
        4
      </text>

      {/* Confused owl in the middle (the "0") */}
      <circle cx="150" cy="100" r="42" fill="#E6B89C" />
      <circle cx="150" cy="102" r="34" fill="#FDF4F5" />

      {/* Eyes - swirly/confused */}
      <circle
        cx="140"
        cy="90"
        r="8"
        fill="white"
        stroke="#14213D"
        strokeWidth="1.5"
      />
      <circle
        cx="160"
        cy="90"
        r="8"
        fill="white"
        stroke="#14213D"
        strokeWidth="1.5"
      />

      {/* Spiral eyes for confusion */}
      <path
        d="M137 90 Q140 86, 143 90 Q140 94, 137 90"
        stroke="#14213D"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M157 90 Q160 86, 163 90 Q160 94, 157 90"
        stroke="#14213D"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Beak */}
      <path
        d="M146 96 L150 102 L154 96"
        fill="#D4956E"
        stroke="#C17A4E"
        strokeWidth="1"
      />

      {/* Confused question marks */}
      <text
        x="170"
        y="75"
        fontSize="14"
        fill="#4A6FA5"
        fontFamily="Georgia"
        opacity="0.6"
      >
        ?
      </text>
      <text
        x="122"
        y="72"
        fontSize="10"
        fill="#E6B89C"
        fontFamily="Georgia"
        opacity="0.5"
      >
        ?
      </text>

      {/* Small cap tilted */}
      <polygon
        points="150,56 130,66 150,72 170,66"
        fill="#14213D"
        transform="rotate(-15 150 64)"
      />

      {/* Ground line - wavy */}
      <path
        d="M30 170 Q75 164, 120 170 Q165 176, 210 170 Q255 164, 280 170"
        stroke="#E2D6D8"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Scattered papers */}
      <rect
        x="60"
        y="150"
        width="20"
        height="15"
        rx="2"
        fill="#F7F0F1"
        stroke="#E2D6D8"
        transform="rotate(-10 70 157)"
      />
      <rect
        x="220"
        y="148"
        width="18"
        height="14"
        rx="2"
        fill="#F7F0F1"
        stroke="#E2D6D8"
        transform="rotate(8 229 155)"
      />
    </svg>
  );
}
