"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ErrorIllustration } from "@/components/illustrations";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [dashboardHref, setDashboardHref] = useState("/dashboard");

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setDashboardHref("/admin/dashboard");
    } else if (pathname.startsWith("/staff")) {
      setDashboardHref("/staff/dashboard");
    } else if (typeof window !== "undefined") {
      if (localStorage.getItem("adminId")) {
        setDashboardHref("/admin/dashboard");
      } else if (localStorage.getItem("staffId")) {
        setDashboardHref("/staff/dashboard");
      }
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        <ErrorIllustration className="mx-auto mb-8" />

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="font-body text-muted-fg mb-2 leading-relaxed">
          Don&apos;t worry, it&apos;s not your fault! Our team has been notified
          and we&apos;re working on a fix.
        </p>
        <p className="font-body text-xs text-muted-fg mb-8">
          Error: {error.message || "An unexpected error occurred"}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="
              inline-flex items-center justify-center px-6 py-3 rounded-xl
              bg-ocean-400 text-white font-body font-medium text-sm
              hover:bg-ocean-500 active:bg-ocean-600
              shadow-soft hover:shadow-glow transition-all duration-200
              transform hover:scale-[1.02] active:scale-[0.98]
            "
          >
            Try Again
          </button>
          <a
            href={dashboardHref}
            className="
              inline-flex items-center justify-center px-6 py-3 rounded-xl
              bg-transparent text-ocean-400 font-body font-medium text-sm
              border-2 border-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-400/10
              transition-all duration-200
            "
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
