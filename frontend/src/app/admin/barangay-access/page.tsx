/* ================================================================
   ADMIN — BARANGAY ACCESS CONTROL
   Toggle which barangays can login / submit requirements
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
  CalendarDays,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";

interface BarangayRow {
  id: number;
  barangay: string;
  is_open: boolean;
  submission_open_date: string | null;
  submission_close_date: string | null;
  updated_at: string;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export default function BarangayAccessPage() {
  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dateModalBrgy, setDateModalBrgy] = useState<string | null>(null);
  const [bulkDateModal, setBulkDateModal] = useState(false);
  const [bulkOpenDate, setBulkOpenDate] = useState("");
  const [bulkCloseDate, setBulkCloseDate] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/barangay-access", {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const { data } = await res.json();
        // Normalize is_open from MySQL 0/1 to boolean
        setBarangays(
          data.map((b: BarangayRow) => ({
            ...b,
            is_open: !!b.is_open,
            submission_open_date: b.submission_open_date || null,
            submission_close_date: b.submission_close_date || null,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (brgy: string) => {
    setBarangays((prev) =>
      prev.map((b) =>
        b.barangay === brgy ? { ...b, is_open: !b.is_open } : b,
      ),
    );
    setDirty(true);
    setSaved(false);
  };

  const setDate = (
    brgy: string,
    field: "submission_open_date" | "submission_close_date",
    value: string,
  ) => {
    setBarangays((prev) =>
      prev.map((b) =>
        b.barangay === brgy ? { ...b, [field]: value || null } : b,
      ),
    );
    setDirty(true);
    setSaved(false);
  };

  const toggleAll = (open: boolean) => {
    setBarangays((prev) =>
      prev.map((b) => ({
        ...b,
        is_open: open,
        // Clear dates when closing all
        ...(open
          ? {}
          : { submission_open_date: null, submission_close_date: null }),
      })),
    );
    setDirty(true);
    setSaved(false);
  };

  const openBulkDateModal = () => {
    setBulkOpenDate("");
    setBulkCloseDate("");
    setBulkSelected(new Set(barangays.map((b) => b.barangay)));
    setBulkDateModal(true);
  };

  const toggleBulkSelect = (brgy: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(brgy)) next.delete(brgy);
      else next.add(brgy);
      return next;
    });
  };

  const toggleBulkAll = () => {
    if (bulkSelected.size === barangays.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(barangays.map((b) => b.barangay)));
    }
  };

  const applyBulkDates = () => {
    setBarangays((prev) =>
      prev.map((b) =>
        bulkSelected.has(b.barangay)
          ? {
              ...b,
              is_open: true,
              submission_open_date: bulkOpenDate || null,
              submission_close_date: bulkCloseDate || null,
            }
          : b,
      ),
    );
    setDirty(true);
    setSaved(false);
    setBulkDateModal(false);
  };

  const save = async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setSaving(true);
    try {
      const openBarangays = barangays
        .filter((b) => !!b.is_open)
        .map((b) => b.barangay);

      // Build submission dates map
      const submissionDates: Record<
        string,
        { open: string | null; close: string | null }
      > = {};
      for (const b of barangays) {
        submissionDates[b.barangay] = {
          open: b.submission_open_date,
          close: b.submission_close_date,
        };
      }

      await fetch("/api/admin/barangay-access", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({ openBarangays, submissionDates }),
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openCount = barangays.filter((b) => b.is_open).length;
  const closedCount = barangays.length - openCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-7 h-7 text-ocean-400" />
            Barangay Access Control
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            Control which barangays can log in and submit requirements today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={!dirty || saving}
            isLoading={saving}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-50 dark:bg-sage-400/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sage-500" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {openCount}
            </p>
            <p className="text-xs font-body text-muted-fg">Open Barangays</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-coral-400" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {closedCount}
            </p>
            <p className="text-xs font-body text-muted-fg">Closed</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toggleAll(true)}
              >
                Open All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toggleAll(false)}
              >
                Close All
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={openBulkDateModal}
            >
              <CalendarDays className="w-4 h-4 mr-1" />
              Set Dates for All
            </Button>
          </div>
        </Card>
      </div>

      {/* Barangay grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-card-bg border border-card-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {barangays.map((b) => (
            <motion.div key={b.id} variants={fadeUp}>
              <div
                className={`
                    w-full rounded-xl border-2 transition-all duration-200 overflow-hidden
                    ${
                      b.is_open
                        ? "bg-emerald-50/50 dark:bg-emerald-400/5 border-emerald-400 dark:border-emerald-500/50"
                        : "bg-red-50/50 dark:bg-red-400/5 border-red-400 dark:border-red-500/50"
                    }
                  `}
              >
                {/* Toggle row */}
                <button
                  onClick={() => toggle(b.barangay)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <MapPin
                      className={`w-4 h-4 ${
                        b.is_open ? "text-sage-500" : "text-muted-fg"
                      }`}
                    />
                    <span
                      className={`text-sm font-body font-medium ${
                        b.is_open ? "text-foreground" : "text-muted-fg"
                      }`}
                    >
                      {b.barangay}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.is_open ? "success" : "neutral"}>
                      {b.is_open ? "Open" : "Closed"}
                    </Badge>
                    {b.is_open ? (
                      <ToggleRight className="w-6 h-6 text-sage-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-fg" />
                    )}
                  </div>
                </button>

                {/* Date schedule button */}
                <div className="border-t border-card-border">
                  <button
                    onClick={() => setDateModalBrgy(b.barangay)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-body text-muted-fg hover:text-foreground transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    {b.is_open
                      ? b.submission_open_date || b.submission_close_date
                        ? `${b.submission_open_date ?? "—"} → ${b.submission_close_date ?? "—"}`
                        : "No expiry — open until closed"
                      : b.submission_open_date || b.submission_close_date
                        ? `Scheduled: ${b.submission_open_date ?? "—"} → ${b.submission_close_date ?? "—"}`
                        : "Select a date to schedule"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Date picker popup modal */}
      {dateModalBrgy &&
        (() => {
          const b = barangays.find((x) => x.barangay === dateModalBrgy);
          if (!b) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDateModalBrgy(null)}
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative bg-card-bg border border-card-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
              >
                {/* Header */}
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

                {/* Open date */}
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

                {/* Close date */}
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

                {/* Actions */}
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

      {/* Bulk date assignment popup modal */}
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
            {/* Header */}
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

            {/* Date inputs */}
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

            {/* Select all / none */}
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

            {/* Barangay checklist */}
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

            {/* Actions */}
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
