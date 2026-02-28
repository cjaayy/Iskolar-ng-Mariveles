import React from "react";

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
