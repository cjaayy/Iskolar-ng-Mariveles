"use client";

import React from "react";

/* ======================== SELECT DROPDOWN ======================== */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
}

export function Select({
  label,
  options,
  error,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className="block text-sm font-body font-medium text-foreground mb-1.5"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`
          w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
          transition-all duration-200 appearance-none
          focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
          ${error ? "border-coral-400" : "border-input-border"}
        `}
        aria-invalid={!!error}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-coral-400 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
