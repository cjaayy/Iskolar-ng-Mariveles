"use client";

/* ======================== TOGGLE SWITCH ======================== */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  className = "",
}: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors duration-300
            ${checked ? "bg-ocean-400" : "bg-input-border"}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
            shadow-sm transition-transform duration-300 ease-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </div>
      {label && (
        <span className="text-sm font-body text-foreground">{label}</span>
      )}
    </label>
  );
}
