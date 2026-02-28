/* ================================================================
   STAFF VALIDATE LIST — Browse all applications pending validation
   Filters by status, search by name/student number
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
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

/* -- Types -- */
interface Application {
  id: number;
  applicant_name: string;
  student_number: string;
  scholarship_name: string;
  grantor: string;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  course: string;
  college: string;
  year_level: number;
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
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"];

export default function StaffValidateListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const staffId =
    typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/staff/applications?${params.toString()}`, {
        headers: { "x-validator-id": staffId },
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
  }, [staffId, statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchData, 300); // debounce search
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
            Document Validation
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            Review and validate submitted scholarship documents
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
                placeholder="Search by name or student number..."
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
              const docsProgress =
                app.total_requirements > 0
                  ? Math.round(
                      (app.approved_requirements / app.total_requirements) *
                        100,
                    )
                  : 0;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover padding="md">
                    <Link
                      href={`/staff/validate/${app.id}`}
                      className="flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {/* Applicant Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ocean-300 to-peach-300 flex items-center justify-center text-sm font-heading font-bold text-white shrink-0">
                          {app.applicant_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-medium text-foreground text-sm truncate">
                            {app.applicant_name}
                          </p>
                          <p className="text-xs font-body text-muted-fg truncate">
                            {app.student_number} &middot;{" "}
                            {(ORDINALS[app.year_level] ??
                              `${app.year_level}th`) + " Year"}{" "}
                            &middot; {app.course}
                          </p>
                        </div>
                      </div>

                      {/* Scholarship */}
                      <div className="md:w-40 shrink-0">
                        <p className="text-sm font-body text-foreground truncate">
                          {app.scholarship_name}
                        </p>
                        <p className="text-xs font-body text-muted-fg">
                          {app.grantor}
                        </p>
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
                            {app.approved_requirements}/{app.total_requirements}
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
