/* ================================================================
   ADMIN VALIDATE — Browse all applications pending validation
   across ALL barangays. Filters by status, search by name.
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Filter,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Users,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

/* -- Types -- */
interface Application {
  id: number;
  applicant_name: string;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  barangay: string | null;
}

/* -- Status config -- */
const statusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "neutral";
    icon: typeof CheckCircle2;
  }
> = {
  submitted: { label: "Submitted", variant: "info", icon: Clock },
  under_review: {
    label: "Under Review",
    variant: "warning",
    icon: ClipboardCheck,
  },
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
  returned: { label: "Returned", variant: "neutral", icon: AlertCircle },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/* -- Animations -- */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function AdminValidateListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/validations?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch applications:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Validate Requirements
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            Review and validate submitted requirements across all barangays
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRefreshing(true);
            fetchData();
          }}
          isLoading={refreshing}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </motion.div>

      {/* ── Filters ────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicant name..."
                className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-fg" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                    statusFilter === opt.value
                      ? "bg-ocean-400 text-white shadow-sm"
                      : "bg-muted text-muted-fg hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Applications List ──────────────────────────────── */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-fg mx-auto mb-4 opacity-30" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No Applications Found
              </h3>
              <p className="font-body text-sm text-muted-fg">
                {search
                  ? "No results match your search query."
                  : "No applications to review at this time."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app, idx) => {
              const cfg = statusConfig[app.status] ?? statusConfig.submitted;
              const submittedDocs =
                app.approved_requirements + app.pending_requirements;
              const docsProgress =
                app.total_requirements > 0
                  ? Math.round((submittedDocs / app.total_requirements) * 100)
                  : 0;
              const barangay = app.barangay || "Unknown";

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover padding="md">
                    <Link
                      href={`/admin/validate/${app.id}`}
                      className="flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {/* Applicant info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-heading font-bold text-sm">
                            {app.applicant_name
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-body font-semibold text-foreground truncate">
                            {app.applicant_name}
                          </p>
                          <p className="text-xs font-body text-muted-fg truncate">
                            Iskolar ng Mariveles
                          </p>
                        </div>
                      </div>

                      {/* Barangay */}
                      <div className="md:w-36 shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-body text-muted-fg">
                          <MapPin className="w-3 h-3" />
                          {barangay}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="md:w-32 shrink-0">
                        <Badge variant={cfg.variant} dot>
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Doc progress */}
                      <div className="md:w-28 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sage-400 rounded-full transition-all"
                              style={{ width: `${docsProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-body text-muted-fg whitespace-nowrap">
                            {submittedDocs}/{app.total_requirements}
                          </span>
                        </div>
                        {app.pending_requirements > 0 && (
                          <p className="text-[11px] font-body text-amber-500 mt-0.5">
                            {app.pending_requirements} pending
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-muted-fg shrink-0 hidden md:block" />
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
