import React from "react";

/* -- Iskolar Mascot: A friendly owl with a graduation cap -- */
export function Mascot({
  className = "",
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="60" cy="72" rx="34" ry="36" fill="#E6B89C" />
      <ellipse cx="60" cy="74" rx="28" ry="28" fill="#FDF4F5" />

      {/* Belly pattern - hand-drawn feel */}
      <path
        d="M45 65 Q52 60, 60 65 Q68 60, 75 65"
        stroke="#F5D6CC"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M47 72 Q54 67, 60 72 Q66 67, 73 72"
        stroke="#F5D6CC"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <circle
        cx="48"
        cy="55"
        r="10"
        fill="white"
        stroke="#14213D"
        strokeWidth="1.5"
      />
      <circle
        cx="72"
        cy="55"
        r="10"
        fill="white"
        stroke="#14213D"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="54" r="5" fill="#14213D" />
      <circle cx="74" cy="54" r="5" fill="#14213D" />
      <circle cx="51.5" cy="52.5" r="1.5" fill="white" />
      <circle cx="75.5" cy="52.5" r="1.5" fill="white" />

      {/* Beak */}
      <path
        d="M56 60 L60 67 L64 60"
        fill="#D4956E"
        stroke="#C17A4E"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Eyebrows - slightly uneven for personality */}
      <path
        d="M39 46 Q44 42, 50 44"
        stroke="#14213D"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M70 44 Q76 42, 81 46"
        stroke="#14213D"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Graduation cap */}
      <polygon points="60,18 30,32 60,40 90,32" fill="#14213D" />
      <rect x="57" y="18" width="6" height="4" rx="1" fill="#4A6FA5" />
      <line
        x1="85"
        y1="32"
        x2="88"
        y2="44"
        stroke="#14213D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="88"
        cy="46"
        r="3"
        fill="#F5C026"
        stroke="#E0A800"
        strokeWidth="1"
      />

      {/* Feet */}
      <path
        d="M45 100 Q42 106, 38 104 Q42 108, 46 106 Q44 110, 48 108 L52 100"
        fill="#D4956E"
      />
      <path
        d="M68 100 Q72 106, 76 104 Q72 108, 68 106 Q70 110, 66 108 L62 100"
        fill="#D4956E"
      />

      {/* Wings - slightly asymmetric for hand-drawn feel */}
      <path
        d="M26 65 Q22 72, 24 82 Q28 78, 30 70"
        fill="#E6B89C"
        stroke="#D4956E"
        strokeWidth="1"
      />
      <path
        d="M94 65 Q98 72, 96 82 Q92 78, 90 70"
        fill="#E6B89C"
        stroke="#D4956E"
        strokeWidth="1"
      />

      {/* Blush cheeks */}
      <ellipse cx="40" cy="62" rx="5" ry="3" fill="#FFD9B3" opacity="0.6" />
      <ellipse cx="80" cy="62" rx="5" ry="3" fill="#FFD9B3" opacity="0.6" />
    </svg>
  );
}
