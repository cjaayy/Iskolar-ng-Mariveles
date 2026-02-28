"use client";

/* ======================== FILE PILL ======================== */

interface FilePillProps {
  name: string;
  size?: string;
  onRemove?: () => void;
  className?: string;
}

export function FilePill({
  name,
  size,
  onRemove,
  className = "",
}: FilePillProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-ocean-50 dark:bg-ocean-400/10 border border-ocean-200 dark:border-ocean-400/20
        text-sm font-body text-ocean-600 dark:text-ocean-200
        ${className}
      `}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 1h5.586L13 4.414V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 1v4h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="truncate max-w-[150px]">{name}</span>
      {size && <span className="text-xs text-muted-fg">{size}</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-muted-fg hover:text-coral-400 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
