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
  Mail,
  Phone,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

interface Applicant {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  contact_number: string | null;
  created_at: string;
  total_applications: number;
  approved_applications: number;
}

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

type ViewMode = "applicants" | "applications";

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

export default function AdminApplicantsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("applications");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchApplicants = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/applicants?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setApplicants(json.data);
        setTotal(json.meta.total);
      }
    } catch (e) {
      console.error("Failed to fetch applicants:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, search]);

  const fetchApplications = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(
        `/api/admin/applicants?view=applications&${params.toString()}`,
        { headers: { "x-admin-id": adminId } },
      );
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data);
        setTotal(json.meta.total);
      }
    } catch (e) {
      console.error("Failed to fetch applications:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, statusFilter, search]);

  const fetchData =
    viewMode === "applications" ? fetchApplications : fetchApplicants;

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
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Applicants
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            {total}{" "}
            {viewMode === "applications"
              ? `application${total !== 1 ? "s" : ""} across all barangays`
              : `registered applicant${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => {
                setViewMode("applications");
                setLoading(true);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                viewMode === "applications"
                  ? "bg-ocean-400 text-white shadow-sm"
                  : "text-muted-fg hover:text-foreground"
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => {
                setViewMode("applicants");
                setLoading(true);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                viewMode === "applicants"
                  ? "bg-ocean-400 text-white shadow-sm"
                  : "text-muted-fg hover:text-foreground"
              }`}
            >
              People
            </button>
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
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  viewMode === "applications"
                    ? "Search applicant name or student number..."
                    : "Search by name, email, or student number..."
                }
                className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
              />
            </div>

            {viewMode === "applications" && (
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
            )}
          </div>
        </Card>
      </motion.div>

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
        ) : viewMode === "applications" ? (
          applications.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-muted-fg mx-auto mb-4 opacity-30" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                  No Applications Found
                </h3>
                <p className="font-body text-sm text-muted-fg">
                  {search
                    ? "No results match your search query."
                    : "No applications have been submitted yet."}
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

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card hover padding="md">
                      <Link
                        href={`/admin/applicants/${app.id}`}
                        className="flex flex-col md:flex-row md:items-center gap-4"
                      >
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
                            {app.barangay && (
                              <p className="text-[11px] font-body text-muted-fg truncate">
                                {app.barangay}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="md:w-32 shrink-0">
                          <Badge variant={cfg.variant} dot>
                            {cfg.label}
                          </Badge>
                        </div>

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

                        <ArrowRight className="w-4 h-4 text-muted-fg shrink-0 hidden md:block" />
                      </Link>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : applicants.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-fg mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No Applicants Found
              </h3>
              <p className="font-body text-muted-fg text-sm">
                {search
                  ? "Try a different search term."
                  : "No applicants have registered yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {applicants.map((a) => (
              <Card key={a.user_id} padding="md" hover>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-ocean-50 dark:bg-ocean-400/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-ocean-400 font-heading font-bold text-lg">
                      {a.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">
                        {a.full_name}
                      </h3>
                      <Badge variant={a.is_active ? "success" : "error"} dot>
                        {a.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {a.email}
                      </span>
                      {a.contact_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {a.contact_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-heading font-bold text-foreground">
                        {a.total_applications}
                      </p>
                      <p className="text-[10px] font-body text-muted-fg">
                        Applications
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-heading font-bold text-sage-500">
                        {a.approved_applications}
                      </p>
                      <p className="text-[10px] font-body text-muted-fg">
                        Approved
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
