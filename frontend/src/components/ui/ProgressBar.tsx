"use client";

/* ======================== PROGRESS BAR ======================== */

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "ocean" | "sage" | "peach" | "coral" | "amber";
  className?: string;
}

const progressColors = {
  ocean: "bg-ocean-400",
  sage: "bg-sage-400",
  peach: "bg-peach-400",
  coral: "bg-coral-400",
  amber: "bg-amber-400",
};

const progressTrackSize = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  label,
  showValue = true,
  size = "md",
  color = "ocean",
  className = "",
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-body text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-body font-medium text-muted-fg">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${progressTrackSize[size]}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className={`${progressColors[color]} ${progressTrackSize[size]} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clampedValue}%`,
            ["--progress-width" as string]: `${clampedValue}%`,
          }}
        />
      </div>
    </div>
  );
}
