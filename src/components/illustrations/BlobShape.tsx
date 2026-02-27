import React from "react";

/* -- Decorative Blob Shapes -- */
export function BlobShape({
  className = "",
  color = "#4A6FA5",
  opacity = 0.1,
  size = 200,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M44.7,-76.4C58.8,-69.2,71.8,-58.8,79.6,-45.2C87.5,-31.7,90.2,-15.8,88.5,-1C86.8,13.8,80.7,27.7,72.2,39.5C63.7,51.3,52.8,61,40.4,68.6C28,76.2,14,81.7,-0.8,83.1C-15.6,84.5,-31.1,81.8,-44.5,74.8C-57.8,67.8,-68.9,56.5,-76.4,43.1C-83.9,29.7,-87.7,14.8,-86.6,0.6C-85.5,-13.6,-79.4,-27.3,-71.3,-39.3C-63.3,-51.3,-53.2,-61.7,-41.1,-70C-29,-78.3,-14.5,-84.5,0.6,-85.5C15.7,-86.5,31.3,-82.3,44.7,-76.4Z"
        transform="translate(100 100)"
        fill={color}
        opacity={opacity}
      />
    </svg>
  );
}

export function BlobShape2({
  className = "",
  color = "#E6B89C",
  opacity = 0.15,
  size = 200,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M39.5,-65.3C52.9,-59.5,66.8,-52.4,74.3,-41C81.8,-29.5,82.9,-14.8,80.4,-1.4C77.9,11.9,71.8,23.8,64.3,34.8C56.8,45.7,47.8,55.6,36.5,62.4C25.3,69.2,11.6,72.8,-1.5,75.4C-14.7,78,-29.4,79.7,-41.5,74.1C-53.6,68.5,-63.2,55.7,-70.2,42C-77.2,28.3,-81.8,13.7,-81.8,-0.9C-81.8,-15.5,-77.2,-31,-68.7,-43.2C-60.2,-55.3,-47.8,-64.1,-34.7,-70.2C-21.5,-76.3,-10.8,-79.7,1.3,-82C13.3,-84.2,26.6,-85.3,39.5,-65.3Z"
        transform="translate(100 100)"
        fill={color}
        opacity={opacity}
      />
    </svg>
  );
}
