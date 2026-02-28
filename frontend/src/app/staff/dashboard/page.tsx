/* ================================================================
   STAFF DASHBOARD — Overview of all pending validations
   Shows stats, recent submissions, and quick access to validations
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, Badge, Skeleton } from "@/components/ui";
import { useStaffSession } from "@/components/providers/StaffSessionProvider";

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
  year_level: number;
}

interface Summary {
  submitted?: number;
  under_review?: number;
  approved?: number;
  rejected?: number;
  returned?: number;
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

/* -- Animations -- */
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"];

export default function StaffDashboardPage() {
  const { user } = useStaffSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);

  const staffId =
    typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    try {
      const res = await fetch("/api/staff/applications", {
        headers: { "x-validator-id": staffId },
      });
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data);
        setSummary(json.summary);
      }
    } catch (e) {
      console.error("Failed to load staff dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalApps =
    (summary.submitted ?? 0) +
    (summary.under_review ?? 0) +
    (summary.approved ?? 0) +
    (summary.rejected ?? 0) +
    (summary.returned ?? 0);

  const greeting = user
    ? `Welcome back, ${user.firstName}!`
    : "Staff Dashboard";

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          {greeting}
        </h1>
        <p className="font-body text-muted-fg mt-1">
          Review and validate scholarship document submissions
        </p>
      </motion.div>

      {/* ── Stats Cards ────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))
        ) : (
          <>
            <Card padding="md" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-ocean-400/10 rounded-bl-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-ocean-400" />
                  <p className="text-xs font-body text-muted-fg">
                    Total Applications
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {totalApps}
                </p>
              </div>
            </Card>
            <Card padding="md" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-bl-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-body text-muted-fg">
                    Pending Review
                  </p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {(summary.submitted ?? 0) + (summary.under_review ?? 0)}
                </p>
              </div>
            </Card>
            <Card padding="md" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sage-400/10 rounded-bl-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-sage-400" />
                  <p className="text-xs font-body text-muted-fg">Approved</p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {summary.approved ?? 0}
                </p>
              </div>
            </Card>
            <Card padding="md" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-coral-400/10 rounded-bl-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-coral-400" />
                  <p className="text-xs font-body text-muted-fg">Rejected</p>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {summary.rejected ?? 0}
                </p>
              </div>
            </Card>
          </>
        )}
      </motion.div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/staff/validate"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-400 hover:bg-sage-500 text-white font-body font-medium text-sm rounded-xl transition-colors shadow-soft"
        >
          <ClipboardCheck className="w-4 h-4" />
          Go to Document Validation
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* ── Recent Applications Table ──────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card padding="none">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Recent Applications
            </h2>
            <p className="text-sm font-body text-muted-fg">
              Latest {Math.min(applications.length, 10)} submissions requiring
              attention
            </p>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-40" />
              <p className="font-body text-muted-fg">
                No applications to review yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-body font-medium text-muted-fg uppercase tracking-wider">
                    <th className="px-6 py-3">Applicant</th>
                    <th className="px-6 py-3">Scholarship</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Documents</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {applications.slice(0, 10).map((app) => {
                    const cfg =
                      statusConfig[app.status] ?? statusConfig.submitted;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-body font-medium text-foreground text-sm">
                              {app.applicant_name}
                            </p>
                            <p className="text-xs font-body text-muted-fg">
                              {app.student_number} &middot;{" "}
                              {(ORDINALS[app.year_level] ??
                                `${app.year_level}th`) + " Year"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-body text-sm text-foreground">
                            {app.scholarship_name}
                          </p>
                          <p className="text-xs font-body text-muted-fg">
                            {app.grantor}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={cfg.variant} dot>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className="h-full bg-sage-400 rounded-full transition-all"
                                style={{
                                  width:
                                    app.total_requirements > 0
                                      ? `${(app.approved_requirements / app.total_requirements) * 100}%`
                                      : "0%",
                                }}
                              />
                            </div>
                            <span className="text-xs font-body text-muted-fg">
                              {app.approved_requirements}/
                              {app.total_requirements}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-body text-muted-fg">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/staff/validate/${app.id}`}
                            className="inline-flex items-center gap-1 text-sm font-body font-medium text-ocean-400 hover:text-ocean-500 transition-colors"
                          >
                            Review
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
