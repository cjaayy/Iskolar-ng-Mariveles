"use client";

import React from "react";
import { StaffAppShell } from "@/components/layout/StaffAppShell";
import { StaffSessionProvider } from "@/components/providers/StaffSessionProvider";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffSessionProvider>
      <StaffAppShell>{children}</StaffAppShell>
    </StaffSessionProvider>
  );
}
