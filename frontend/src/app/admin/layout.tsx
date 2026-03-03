"use client";

import React from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { AdminSessionProvider } from "@/components/providers/AdminSessionProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      <AdminAppShell>{children}</AdminAppShell>
    </AdminSessionProvider>
  );
}
