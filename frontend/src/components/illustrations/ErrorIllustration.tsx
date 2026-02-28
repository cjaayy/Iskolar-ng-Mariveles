import React from "react";

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
