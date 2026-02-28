"use client";

/* ======================== CHECKBOX ======================== */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
  id,
}: CheckboxProps) {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substring(7)}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2.5 cursor-pointer group ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            w-5 h-5 rounded-md border-2 transition-all duration-200
            flex items-center justify-center
            group-hover:border-ocean-300
            peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-400/30
            ${
              checked
                ? "bg-ocean-400 border-ocean-400"
                : "bg-input-bg border-input-border"
            }
          `}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white animate-check-pop"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6 L5 9 L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span
          className={`text-sm font-body select-none transition-colors ${checked ? "text-foreground" : "text-muted-fg"}`}
        >
          {label}
        </span>
      )}
    </label>
  );
}
