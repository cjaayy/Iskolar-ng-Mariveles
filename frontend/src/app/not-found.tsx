/* ================================================================
   CUSTOM 404 PAGE
   Friendly not-found with the owl mascot looking confused
   ================================================================ */

import Link from "next/link";
import { NotFoundIllustration } from "@/components/illustrations";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        <NotFoundIllustration className="mx-auto mb-8" />

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          Oops! Page not found
        </h1>
        <p className="font-body text-muted-fg mb-8 leading-relaxed">
          It looks like this page wandered off. Don&apos;t worry — we&apos;ll
          help you find your way back!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="
              inline-flex items-center justify-center px-6 py-3 rounded-xl
              bg-ocean-400 text-white font-body font-medium text-sm
              hover:bg-ocean-500 active:bg-ocean-600
              shadow-soft hover:shadow-glow transition-all duration-200
              transform hover:scale-[1.02] active:scale-[0.98]
            "
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="
              inline-flex items-center justify-center px-6 py-3 rounded-xl
              bg-transparent text-ocean-400 font-body font-medium text-sm
              border-2 border-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-400/10
              transition-all duration-200
            "
          >
            Back to Login
          </Link>
        </div>

        {/* Decorative wavy line */}
        <svg
          className="mx-auto mt-12 text-muted-fg opacity-20"
          width="160"
          height="8"
          viewBox="0 0 160 8"
          aria-hidden="true"
        >
          <path
            d="M2 4 Q20 0, 40 4 Q60 8, 80 4 Q100 0, 120 4 Q140 8, 158 4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
