"use client";

import { AppShell } from "@/components/layout/AppShell";
import { HelpWidget } from "@/components/layout/HelpWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <HelpWidget />
    </>
  );
}
