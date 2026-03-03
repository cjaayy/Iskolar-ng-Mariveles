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
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";

interface BarangayRow {
  id: number;
  barangay: string;
  is_open: boolean;
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
        setBarangays(data);
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

  const toggleAll = (open: boolean) => {
    setBarangays((prev) => prev.map((b) => ({ ...b, is_open: open })));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setSaving(true);
    try {
      const openBarangays = barangays
        .filter((b) => b.is_open)
        .map((b) => b.barangay);
      await fetch("/api/admin/barangay-access", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({ openBarangays }),
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
          <div className="flex gap-2 w-full">
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
              <button
                onClick={() => toggle(b.barangay)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
                  ${
                    b.is_open
                      ? "bg-sage-50/50 dark:bg-sage-400/5 border-sage-300 dark:border-sage-500/30 hover:border-sage-400"
                      : "bg-card-bg border-card-border hover:border-muted-fg/30"
                  }
                `}
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
            </motion.div>
          ))}
        </motion.div>
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
