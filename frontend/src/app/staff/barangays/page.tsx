/* ================================================================
   STAFF — LIST OF APPLICANTS
   Simple name list for the validator's assigned barangay
   with search bar and popup modal for applicant details
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  User,
  Mail,
  Phone,
  Home,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";
import { useStaffSession } from "@/components/providers/StaffSessionProvider";

/* ── Types ─────────────────────────────────────────────── */
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

interface ApplicationDetail {
  id: number;
  applicant_id: number;
  status: string;
  submitted_at: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  address: string | null;
}

interface RequirementSummary {
  requirement_key: string;
  status: string;
}

/* ── Animations ────────────────────────────────────────── */
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

/* ── Detail row helper ─────────────────────────────────── */
function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-muted-fg mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-body text-muted-fg leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-body text-foreground font-medium break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function StaffBarangaysPage() {
  const [allApplicants, setAllApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalApplicant, setModalApplicant] = useState<ApplicantRow | null>(
    null,
  );
  const [detailCache, setDetailCache] = useState<
    Record<number, { app: ApplicationDetail; reqs: RequirementSummary[] }>
  >({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  const staffId =
    typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

  const { user } = useStaffSession();
  const assignedBarangay = user?.assignedBarangay ?? null;

  /* ── Load list ───────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/staff/barangays", {
        headers: { "x-validator-id": staffId },
      });
      if (res.ok) {
        const data = await res.json();
        const grouped: Record<string, ApplicantRow[]> = data.grouped || {};
        const flat: ApplicantRow[] = Object.values(grouped).flat();
        setAllApplicants(flat);
      }
    } catch (e) {
      console.error("[StaffBarangays] Failed to load", e);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Fetch detail for a single applicant ─────────────── */
  const fetchDetail = useCallback(
    async (applicationId: number) => {
      if (!staffId || detailCache[applicationId]) return;
      setDetailLoading(applicationId);
      try {
        const res = await fetch(`/api/staff/applications/${applicationId}`, {
          headers: { "x-validator-id": staffId },
        });
        if (res.ok) {
          const json = await res.json();
          setDetailCache((prev) => ({
            ...prev,
            [applicationId]: {
              app: json.data as ApplicationDetail,
              reqs: (json.requirements ?? []).map(
                (r: { requirement_key: string; status: string }) => ({
                  requirement_key: r.requirement_key,
                  status: r.status,
                }),
              ),
            },
          }));
        }
      } catch (e) {
        console.error("Failed to fetch detail", e);
      } finally {
        setDetailLoading(null);
      }
    },
    [staffId, detailCache],
  );

  /* ── Open modal ──────────────────────────────────────── */
  const openModal = (applicant: ApplicantRow) => {
    setModalApplicant(applicant);
    fetchDetail(applicant.application_id);
  };

  /* ── Search filter ───────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!search.trim()) return allApplicants;
    const q = search.toLowerCase();
    return allApplicants.filter(
      (a) =>
        a.applicant_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [allApplicants, search]);

  const pendingCount = filtered.filter(
    (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
  ).length;

  // Modal detail data
  const detail = modalApplicant
    ? detailCache[modalApplicant.application_id]
    : null;
  const isLoadingDetail = modalApplicant
    ? detailLoading === modalApplicant.application_id
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-ocean-400" />
            List of Applicants
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1 flex items-center gap-1.5">
            {assignedBarangay && (
              <>
                <MapPin className="w-3.5 h-3.5" />
                Barangay {assignedBarangay} &middot;{" "}
              </>
            )}
            {allApplicants.length} applicant
            {allApplicants.length !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="text-amber-500 font-medium">
                &middot; {pendingCount} pending
              </span>
            )}
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

      {/* Search bar */}
      <Card padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant by name or email..."
            className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
          />
        </div>
      </Card>

      {/* Applicant list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
          <p className="font-heading text-lg font-semibold text-foreground mb-1">
            {search ? "No Results" : "No Applicants"}
          </p>
          <p className="font-body text-sm text-muted-fg">
            {search
              ? "No applicants match your search."
              : "There are no submitted applications needing validation at this time."}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {filtered.map((a, idx) => {
            const docsSubmitted = a.submitted_requirements;
            const docsTotal = a.total_requirements;
            const progress =
              docsTotal > 0
                ? Math.round((a.approved_requirements / docsTotal) * 100)
                : 0;

            return (
              <motion.div key={a.application_id} variants={fadeUp}>
                <button
                  onClick={() => openModal(a)}
                  className="w-full text-left"
                >
                  <Card hover padding="md">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
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
                          <p className="text-sm font-body font-semibold text-foreground truncate">
                            {idx + 1}. {a.applicant_name}
                          </p>
                          <p className="text-xs text-muted-fg font-body truncate">
                            {a.email}
                          </p>
                        </div>
                      </div>

                      {/* Requirement stats */}
                      <div className="flex items-center gap-3 text-xs font-body flex-shrink-0">
                        <div className="flex items-center gap-2 w-24">
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
                      </div>
                    </div>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Applicant Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {modalApplicant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) =>
              e.target === e.currentTarget && setModalApplicant(null)
            }
            role="dialog"
            aria-modal="true"
            aria-label="Applicant details"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-card-bg border border-card-border rounded-2xl shadow-soft-lg w-full max-w-md overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-heading font-bold text-sm">
                      {modalApplicant.applicant_name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-base font-bold text-foreground truncate">
                      {modalApplicant.applicant_name}
                    </h2>
                    <p className="text-xs font-body text-muted-fg">
                      Applicant Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalApplicant(null)}
                  className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4 space-y-4">
                {isLoadingDetail && !detail ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-fg font-body">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading details…
                  </div>
                ) : detail ? (
                  <>
                    {/* Personal info */}
                    <div className="space-y-3">
                      <DetailItem
                        icon={User}
                        label="Full Name"
                        value={detail.app.applicant_name}
                      />
                      <DetailItem
                        icon={Mail}
                        label="Email"
                        value={detail.app.applicant_email}
                      />
                      <DetailItem
                        icon={Phone}
                        label="Contact Number"
                        value={detail.app.contact_number || "Not provided"}
                      />
                      <DetailItem
                        icon={Home}
                        label="Address"
                        value={detail.app.address || "Not provided"}
                      />
                    </div>

                    {/* Requirement status badges */}
                    <div>
                      <h3 className="text-xs font-heading font-semibold text-muted-fg uppercase tracking-wider mb-2">
                        Requirements Status
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.reqs.map((r) => {
                          const variant =
                            r.status === "approved"
                              ? "success"
                              : r.status === "rejected"
                                ? "error"
                                : r.status === "pending"
                                  ? "warning"
                                  : "neutral";
                          return (
                            <Badge
                              key={r.requirement_key}
                              variant={variant}
                              dot
                            >
                              {r.requirement_key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                              — {r.status}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-fg/30 mx-auto mb-2" />
                    <p className="text-sm font-body text-muted-fg">
                      Could not load applicant details.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-5 py-4 border-t border-card-border flex items-center justify-between gap-3">
                <div className="text-xs font-body text-muted-fg">
                  {modalApplicant.pending_requirements > 0 && (
                    <span className="text-amber-500 font-medium">
                      {modalApplicant.pending_requirements} requirement
                      {modalApplicant.pending_requirements !== 1
                        ? "s"
                        : ""}{" "}
                      pending
                    </span>
                  )}
                  {modalApplicant.pending_requirements === 0 &&
                    modalApplicant.approved_requirements ===
                      modalApplicant.total_requirements &&
                    modalApplicant.total_requirements > 0 && (
                      <span className="text-sage-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All approved
                      </span>
                    )}
                </div>
                <Link href={`/staff/validate/${modalApplicant.application_id}`}>
                  <Button
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                    className="bg-ocean-400 hover:bg-ocean-500 text-white"
                  >
                    Validate Requirements
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
