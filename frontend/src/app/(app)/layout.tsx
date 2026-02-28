"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HelpWidget } from "@/components/layout/HelpWidget";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
      <HelpWidget />
    </SessionProvider>
  );
}
