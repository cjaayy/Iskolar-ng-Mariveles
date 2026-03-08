"use client";

import React from "react";

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
    <div className={`relative pt-5 ${className}`}>
      <div className="relative">
        <textarea
          id={textareaId}
          placeholder=" "
          className={`
            peer w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
            transition-all duration-200 resize-none min-h-[100px]
            placeholder-transparent
            focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
            hover:border-ocean-300
            ${error ? "border-coral-400" : "border-input-border"}
          `}
          aria-invalid={!!error}
          {...props}
        />
        <label
          htmlFor={textareaId}
          className={`
            floating-label absolute left-4 top-6 text-muted-fg font-body text-sm
            transition-all duration-200 pointer-events-none select-none
            peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-ocean-400 peer-focus:font-medium
            peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]
            ${error ? "peer-focus:text-coral-400" : ""}
          `}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-coral-400 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
