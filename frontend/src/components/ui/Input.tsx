"use client";

import React from "react";

/* ======================== INPUT ======================== */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={`relative pt-5 ${className}`}>
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          placeholder=" "
          className={`
            peer w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
            transition-all duration-200
            placeholder-transparent
            focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
            hover:border-ocean-300
            ${leftIcon ? "pl-10" : ""}
            ${error ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-input-border"}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            floating-label absolute top-1/2 -translate-y-1/2 text-muted-fg font-body
            transition-all duration-200 pointer-events-none select-none
            peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-ocean-400 peer-focus:font-medium
            peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]
            ${leftIcon ? "left-10" : "left-4"}
            ${error ? "peer-focus:text-coral-400" : ""}
          `}
        >
          {label}
        </label>
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
          role="alert"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="mt-1.5 text-xs text-muted-fg font-body"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
