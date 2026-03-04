/* ================================================================
   STAFF — BARANGAY APPLICANTS
   List of barangays with applicants needing validation
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";
import { useStaffSession } from "@/components/providers/StaffSessionProvider";

const MARIVELES_BARANGAYS = [
  "Alas-asin",
  "Alion",
  "Balon-Anito",
  "Baseco Country (Bataan Shipyard)",
  "Batangas II",
  "Biaan",
  "Cabcaben",
  "Camaya",
  "Casili (Cataning)",
  "Ipag",
  "Lucanin",
  "Malaya",
  "Maligaya",
  "Mt. View",
  "Poblacion",
  "San Carlos",
  "San Isidro",
  "Sisiman",
  "Townsite",
];

interface ApplicantRow {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  address: string | null;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  rejected_requirements: number;
}

interface BarangaySummary {
  barangay: string;
  totalApplicants: number;
  pendingValidation: number;
}

/* -- Animations -- */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export default function StaffBarangaysPage() {
  const [grouped, setGrouped] = useState<Record<string, ApplicantRow[]>>({});
  const [summary, setSummary] = useState<BarangaySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterBarangay, setFilterBarangay] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const staffId =
    typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

  const { user } = useStaffSession();
  const assignedBarangay = user?.assignedBarangay ?? null;

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBarangay) params.set("barangay", filterBarangay);

      const res = await fetch(`/api/staff/barangays?${params.toString()}`, {
        headers: { "x-validator-id": staffId },
      });
      if (res.ok) {
        const data = await res.json();
        setGrouped(data.grouped || {});
        setSummary(data.summary || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("[StaffBarangays] Failed to load", e);
    } finally {
      setLoading(false);
    }
  }, [staffId, filterBarangay]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (brgy: string) => {
    setExpanded((prev) => ({ ...prev, [brgy]: !prev[brgy] }));
  };

  const sortedBarangays = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-7 h-7 text-ocean-400" />
            {assignedBarangay ? `Barangay ${assignedBarangay}` : "My Barangay"}
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            {total} applicant{total !== 1 ? "s" : ""} needing validation
            {assignedBarangay
              ? ` in Barangay ${assignedBarangay}`
              : ` across ${sortedBarangays.length} barangay${sortedBarangays.length !== 1 ? "s" : ""}`}
          </p>
        </div>
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
      </div>

      {/* Filter — only show if no assigned barangay (admin viewing) */}
      {!assignedBarangay && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <select
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="bg-card-bg border border-card-border rounded-xl pl-10 pr-8 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 focus:border-ocean-400 transition-all appearance-none"
            >
              <option value="">All Barangays</option>
              {MARIVELES_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Summary chips — only show when no assigned barangay */}
      {!assignedBarangay && !filterBarangay && summary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.map((s) => (
            <button
              key={s.barangay}
              onClick={() => setFilterBarangay(s.barangay)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ocean-50 dark:bg-ocean-400/10 text-ocean-500 dark:text-ocean-400 text-xs font-body font-medium hover:bg-ocean-100 dark:hover:bg-ocean-400/20 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              {s.barangay}
              <span className="font-bold">{s.totalApplicants}</span>
              {s.pendingValidation > 0 && (
                <span className="text-amber-500 font-bold">
                  ({s.pendingValidation} pending)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Barangay groups */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : sortedBarangays.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
          <p className="font-heading text-lg font-semibold text-foreground mb-1">
            No Applicants to Validate
          </p>
          <p className="font-body text-sm text-muted-fg">
            There are no submitted applications needing validation at this time.
          </p>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {sortedBarangays.map((brgy) => {
            const applicants = grouped[brgy];
            const isExpanded = expanded[brgy] ?? true; // default expanded
            const pendingCount = applicants.filter(
              (a) =>
                a.pending_requirements > 0 || a.submitted_requirements === 0,
            ).length;

            return (
              <motion.div key={brgy} variants={fadeUp}>
                <Card className="overflow-hidden">
                  {/* Barangay header bar */}
                  <button
                    onClick={() => toggleExpand(brgy)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ocean-50 dark:bg-ocean-400/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-ocean-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-body font-semibold text-sm text-foreground">
                          {brgy}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-fg font-body">
                            {applicants.length} applicant
                            {applicants.length !== 1 ? "s" : ""}
                          </span>
                          {pendingCount > 0 && (
                            <span className="text-xs text-amber-500 font-body font-medium">
                              {pendingCount} need{pendingCount !== 1 ? "" : "s"}{" "}
                              validation
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pendingCount > 0 ? "warning" : "success"}>
                        {pendingCount > 0
                          ? `${pendingCount} pending`
                          : "All reviewed"}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-fg" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-fg" />
                      )}
                    </div>
                  </button>

                  {/* Expanded applicant list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-card-border divide-y divide-card-border">
                          {applicants.map((a) => {
                            const docsSubmitted = a.submitted_requirements;
                            const docsTotal = a.total_requirements;
                            const progress =
                              docsTotal > 0
                                ? Math.round(
                                    (a.approved_requirements / docsTotal) * 100,
                                  )
                                : 0;

                            return (
                              <Link
                                key={a.application_id}
                                href={`/staff/validate/${a.application_id}`}
                                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors group"
                              >
                                {/* Avatar + info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-heading font-bold text-xs">
                                      {a.applicant_name
                                        .split(" ")
                                        .slice(0, 2)
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-body font-medium text-foreground truncate group-hover:text-ocean-400 transition-colors">
                                      {a.applicant_name}
                                    </p>
                                    <p className="text-xs text-muted-fg font-body truncate">
                                      {a.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Requirement stats */}
                                <div className="flex items-center gap-3 text-xs font-body">
                                  {/* Progress bar */}
                                  <div className="flex items-center gap-2 w-28">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-sage-400 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-muted-fg whitespace-nowrap">
                                      {docsSubmitted}/{docsTotal}
                                    </span>
                                  </div>

                                  {/* Status badges */}
                                  {a.approved_requirements > 0 && (
                                    <span className="inline-flex items-center gap-1 text-sage-500">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {a.approved_requirements}
                                    </span>
                                  )}
                                  {a.pending_requirements > 0 && (
                                    <span className="inline-flex items-center gap-1 text-amber-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      {a.pending_requirements}
                                    </span>
                                  )}
                                  {a.rejected_requirements > 0 && (
                                    <span className="inline-flex items-center gap-1 text-coral-400">
                                      <XCircle className="w-3.5 h-3.5" />
                                      {a.rejected_requirements}
                                    </span>
                                  )}
                                  {docsSubmitted === 0 && (
                                    <span className="inline-flex items-center gap-1 text-muted-fg">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      No docs
                                    </span>
                                  )}

                                  <ArrowRight className="w-4 h-4 text-muted-fg group-hover:text-ocean-400 transition-colors hidden sm:block" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
