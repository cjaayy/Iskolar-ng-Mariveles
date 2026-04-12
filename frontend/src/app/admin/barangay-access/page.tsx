"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldOff } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function BarangayAccessPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/school-access");
  }, [router]);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-coral-500" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Barangay Access is Deprecated
            </h1>
            <p className="text-sm font-body text-muted-fg">
              This page is no longer used. School access controls submissions
              and login windows now.
            </p>
            <Button
              size="sm"
              className="bg-ocean-400 text-white"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push("/admin/school-access")}
              type="button"
            >
              Go to School Access
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
