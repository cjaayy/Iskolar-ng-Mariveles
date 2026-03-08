"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  MapPin,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

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

interface RequirementRow {
  applicant_id: number;
  full_name: string;
  email: string;
  address: string | null;
  application_id: number | null;
  app_status: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
}

export default function BarangayRequirementsPage() {
  const [grouped, setGrouped] = useState<Record<string, RequirementRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterBarangay, setFilterBarangay] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBarangay) params.set("barangay", filterBarangay);

      const res = await fetch(
        `/api/admin/barangay-requirements?${params.toString()}`,
        { headers: { "x-admin-id": adminId } },
      );
      if (res.ok) {
        const data = await res.json();
        setGrouped(data.grouped || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterBarangay]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (brgy: string) => {
    setExpanded((prev) => ({ ...prev, [brgy]: !prev[brgy] }));
  };

  const sortedBarangays = Object.keys(grouped).sort();

  const totalApplicants = Object.values(grouped).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  const totalWithApps = Object.values(grouped)
    .flat()
    .filter((r) => r.application_id).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-ocean-400" />
            Barangay Requirements
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            View submitted requirements per barangay
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

        <div className="flex items-center gap-4 text-sm font-body text-muted-fg ml-auto">
          <span>
            <strong className="text-foreground">{totalApplicants}</strong>{" "}
            applicant{totalApplicants !== 1 ? "s" : ""}
          </span>
          <span>
            <strong className="text-foreground">{totalWithApps}</strong> with
            applications
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : sortedBarangays.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
          <p className="font-body text-muted-fg">No applicants found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedBarangays.map((brgy) => {
            const rows = grouped[brgy];
            const isExpanded = expanded[brgy] ?? false;
            const withSubmissions = rows.filter(
              (r) => r.submitted_requirements > 0,
            ).length;
            const allApproved = rows.filter(
              (r) =>
                r.total_requirements > 0 &&
                r.approved_requirements === r.total_requirements,
            ).length;

            return (
              <Card key={brgy} className="overflow-hidden">
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
                          {rows.length} applicant{rows.length !== 1 ? "s" : ""}
                        </span>
                        {withSubmissions > 0 && (
                          <span className="text-xs text-ocean-400 font-body">
                            {withSubmissions} submitted
                          </span>
                        )}
                        {allApproved > 0 && (
                          <span className="text-xs text-sage-500 font-body">
                            {allApproved} complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{rows.length}</Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-fg" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-fg" />
                    )}
                  </div>
                </button>

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
                        {rows.map((r) => (
                          <div
                            key={r.applicant_id}
                            className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-muted-fg" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-body font-medium text-foreground truncate">
                                  {r.full_name}
                                </p>
                                <p className="text-xs text-muted-fg font-body truncate">
                                  {r.email}
                                </p>
                              </div>
                            </div>

                            {r.application_id && (
                              <span className="text-xs font-body text-muted-fg hidden md:block">
                                Iskolar ng Mariveles
                              </span>
                            )}

                            <div className="flex items-center gap-2 text-xs font-body">
                              {r.application_id ? (
                                <>
                                  {r.approved_requirements > 0 && (
                                    <span className="inline-flex items-center gap-1 text-sage-500">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {r.approved_requirements}
                                    </span>
                                  )}
                                  {r.pending_requirements > 0 && (
                                    <span className="inline-flex items-center gap-1 text-amber-500">
                                      <Clock className="w-3 h-3" />
                                      {r.pending_requirements}
                                    </span>
                                  )}
                                  {r.total_requirements === 0 && (
                                    <span className="inline-flex items-center gap-1 text-muted-fg">
                                      <AlertCircle className="w-3 h-3" />
                                      No submissions
                                    </span>
                                  )}
                                  <Badge
                                    variant={
                                      r.app_status === "approved"
                                        ? "success"
                                        : r.app_status === "rejected"
                                          ? "error"
                                          : r.app_status === "under_review"
                                            ? "warning"
                                            : "neutral"
                                    }
                                  >
                                    {(r.app_status || "draft").replace(
                                      "_",
                                      " ",
                                    )}
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="neutral">No application</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
