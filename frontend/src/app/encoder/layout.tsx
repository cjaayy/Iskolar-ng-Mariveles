"use client";

import React from "react";
import { EncoderAppShell } from "@/components/layout/EncoderAppShell";
import { EncoderSessionProvider } from "@/components/providers/EncoderSessionProvider";

export default function EncoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EncoderSessionProvider>
      <EncoderAppShell>{children}</EncoderAppShell>
    </EncoderSessionProvider>
  );
}
