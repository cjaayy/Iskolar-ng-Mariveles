"use client";

import { ChevronRight } from "lucide-react";

/* ======================== BREADCRUMB ======================== */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm font-body">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="w-3.5 h-3.5 text-muted-fg"
                aria-hidden="true"
              />
            )}
            {item.href && i < items.length - 1 ? (
              <a
                href={item.href}
                className="text-muted-fg hover:text-ocean-400 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={
                  i === items.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-fg"
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
