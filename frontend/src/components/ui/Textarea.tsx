"use client";

import React from "react";

/* ======================== TEXTAREA ======================== */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={`relative ${className}`}>
      <textarea
        id={textareaId}
        placeholder=" "
        className={`
          peer w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
          transition-all duration-200 resize-none min-h-[100px]
          placeholder-transparent
          focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
          ${error ? "border-coral-400" : "border-input-border"}
        `}
        aria-invalid={!!error}
        {...props}
      />
      <label
        htmlFor={textareaId}
        className={`
          absolute left-4 top-3 text-muted-fg font-body
          transition-all duration-200 pointer-events-none
          peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-ocean-400
          peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-[0.85]
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1.5 text-xs text-coral-400 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
