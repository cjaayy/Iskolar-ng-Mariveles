/* ================================================================
   CUSTOM SVG ILLUSTRATIONS
   Hand-crafted mascot, shapes, and decorative elements
   ================================================================ */

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

/* -- Decorative Blob Shapes -- */
export function BlobShape({
  className = "",
  color = "#4A6FA5",
  opacity = 0.1,
  size = 200,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M44.7,-76.4C58.8,-69.2,71.8,-58.8,79.6,-45.2C87.5,-31.7,90.2,-15.8,88.5,-1C86.8,13.8,80.7,27.7,72.2,39.5C63.7,51.3,52.8,61,40.4,68.6C28,76.2,14,81.7,-0.8,83.1C-15.6,84.5,-31.1,81.8,-44.5,74.8C-57.8,67.8,-68.9,56.5,-76.4,43.1C-83.9,29.7,-87.7,14.8,-86.6,0.6C-85.5,-13.6,-79.4,-27.3,-71.3,-39.3C-63.3,-51.3,-53.2,-61.7,-41.1,-70C-29,-78.3,-14.5,-84.5,0.6,-85.5C15.7,-86.5,31.3,-82.3,44.7,-76.4Z"
        transform="translate(100 100)"
        fill={color}
        opacity={opacity}
      />
    </svg>
  );
}

export function BlobShape2({
  className = "",
  color = "#E6B89C",
  opacity = 0.15,
  size = 200,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M39.5,-65.3C52.9,-59.5,66.8,-52.4,74.3,-41C81.8,-29.5,82.9,-14.8,80.4,-1.4C77.9,11.9,71.8,23.8,64.3,34.8C56.8,45.7,47.8,55.6,36.5,62.4C25.3,69.2,11.6,72.8,-1.5,75.4C-14.7,78,-29.4,79.7,-41.5,74.1C-53.6,68.5,-63.2,55.7,-70.2,42C-77.2,28.3,-81.8,13.7,-81.8,-0.9C-81.8,-15.5,-77.2,-31,-68.7,-43.2C-60.2,-55.3,-47.8,-64.1,-34.7,-70.2C-21.5,-76.3,-10.8,-79.7,1.3,-82C13.3,-84.2,26.6,-85.3,39.5,-65.3Z"
        transform="translate(100 100)"
        fill={color}
        opacity={opacity}
      />
    </svg>
  );
}

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

/* -- Success Illustration (for upload complete, etc.) -- */
export function SuccessIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="45" fill="#D8E8D8" />
      <circle cx="60" cy="60" r="35" fill="#B5D4B5" />
      <path
        d="M42 60 L54 72 L78 48"
        stroke="white"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Confetti particles */}
      <rect
        x="20"
        y="20"
        width="6"
        height="3"
        rx="1"
        fill="#F5C026"
        transform="rotate(30 23 21)"
      />
      <rect
        x="90"
        y="25"
        width="5"
        height="3"
        rx="1"
        fill="#4A6FA5"
        transform="rotate(-20 92 26)"
      />
      <rect
        x="25"
        y="85"
        width="6"
        height="3"
        rx="1"
        fill="#E86555"
        transform="rotate(45 28 86)"
      />
      <rect
        x="95"
        y="80"
        width="5"
        height="3"
        rx="1"
        fill="#E6B89C"
        transform="rotate(-35 97 81)"
      />
      <circle cx="15" cy="55" r="2" fill="#F5C026" />
      <circle cx="105" cy="55" r="2" fill="#4A6FA5" />
    </svg>
  );
}

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

/* -- Error Illustration -- */
export function ErrorIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      width="200"
      height="180"
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Warning triangle */}
      <path
        d="M100 30 L170 150 L30 150 Z"
        fill="#FFF8E6"
        stroke="#F5C026"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Exclamation */}
      <line
        x1="100"
        y1="70"
        x2="100"
        y2="110"
        stroke="#E0A800"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="100" cy="130" r="4" fill="#E0A800" />

      {/* Decorative sparks */}
      <line
        x1="60"
        y1="50"
        x2="50"
        y2="40"
        stroke="#E6B89C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="140"
        y1="50"
        x2="150"
        y2="40"
        stroke="#E6B89C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="55"
        y1="60"
        x2="42"
        y2="58"
        stroke="#4A6FA5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="145"
        y1="60"
        x2="158"
        y2="58"
        stroke="#4A6FA5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

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
