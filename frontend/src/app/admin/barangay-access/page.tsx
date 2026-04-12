"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ToggleLeft,
  ToggleRight,
  "use client";

  import React, { useEffect } from "react";
  import Link from "next/link";
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
              <Button asChild size="sm" className="bg-ocean-400 text-white">
                <Link href="/admin/school-access">
                  Go to School Access
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
      )}

      {dateModalBrgy &&
        (() => {
          const b = barangays.find((x) => x.barangay === dateModalBrgy);
          if (!b) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDateModalBrgy(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative bg-card-bg border border-card-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-ocean-400" />
                    <h3 className="font-heading font-bold text-foreground text-lg">
                      Submission Dates
                    </h3>
                  </div>
                  <button
                    onClick={() => setDateModalBrgy(null)}
                    className="p-1 rounded-lg hover:bg-muted-fg/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-fg" />
                  </button>
                </div>

                <p className="text-sm font-body text-muted-fg">
                  Set the submission window for{" "}
                  <span className="font-medium text-foreground">
                    {b.barangay}
                  </span>
                </p>

                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    Open Date
                  </label>
                  <input
                    type="date"
                    value={b.submission_open_date ?? ""}
                    onChange={(e) =>
                      setDate(
                        b.barangay,
                        "submission_open_date",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    Close Date
                  </label>
                  <input
                    type="date"
                    value={b.submission_close_date ?? ""}
                    onChange={(e) =>
                      setDate(
                        b.barangay,
                        "submission_close_date",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setDate(b.barangay, "submission_open_date", "");
                      setDate(b.barangay, "submission_close_date", "");
                    }}
                    className="text-sm text-coral-400 hover:text-coral-500 font-body transition-colors"
                  >
                    Clear dates
                  </button>
                  <Button size="sm" onClick={() => setDateModalBrgy(null)}>
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}

      {bulkDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setBulkOpenDate("");
              setBulkCloseDate("");
              setBulkDateModal(false);
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-card-bg border border-card-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-ocean-400" />
                <h3 className="font-heading font-bold text-foreground text-lg">
                  Set Dates for Multiple Barangays
                </h3>
              </div>
              <button
                onClick={() => {
                  setBulkOpenDate("");
                  setBulkCloseDate("");
                  setBulkDateModal(false);
                }}
                className="p-1 rounded-lg hover:bg-muted-fg/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-fg" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                  Open Date
                </label>
                <input
                  type="date"
                  value={bulkOpenDate}
                  onChange={(e) => setBulkOpenDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                  Close Date
                </label>
                <input
                  type="date"
                  value={bulkCloseDate}
                  onChange={(e) => setBulkCloseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-body text-muted-fg">
                Select barangays ({bulkSelected.size}/{barangays.length})
              </p>
              <button
                onClick={toggleBulkAll}
                className="text-xs font-body text-ocean-400 hover:text-ocean-500 transition-colors"
              >
                {bulkSelected.size === barangays.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-1 max-h-60">
              {barangays.map((b) => {
                const checked = bulkSelected.has(b.barangay);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBulkSelect(b.barangay)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body transition-colors
                      ${
                        checked
                          ? "bg-emerald-50 dark:bg-emerald-400/10 text-foreground"
                          : "hover:bg-muted-fg/5 text-muted-fg"
                      }
                    `}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-fg flex-shrink-0" />
                    )}
                    <span>{b.barangay}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-card-border">
              <button
                onClick={() => {
                  setBulkOpenDate("");
                  setBulkCloseDate("");
                  setBulkDateModal(false);
                }}
                className="text-sm text-muted-fg hover:text-foreground font-body transition-colors"
              >
                Cancel
              </button>
              <Button
                size="sm"
                onClick={applyBulkDates}
                disabled={bulkSelected.size === 0}
              >
                Apply to {bulkSelected.size} Barangay
                {bulkSelected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-ocean-400 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 font-body text-sm">
            <span>You have unsaved changes</span>
            <Button
              size="sm"
              variant="outline"
              onClick={save}
              isLoading={saving}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Save Now
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
