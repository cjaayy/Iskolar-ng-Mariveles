"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MapPin,
  ShieldCheck,
  Loader2,
  X,
  User,
  Heart,
  GraduationCap,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";
import { useStaffSession } from "@/components/providers/StaffSessionProvider";

interface Applicant {
  user_id: string | number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: string | number;
  contact_number: string | null;
  created_at: string;
  total_applications: number;
  approved_applications: number;
}

interface Application {
  id: string | number;
  applicant_name: string;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  barangay: string | null;
  school: string | null;
}

interface ApplicationDetail {
  id: string | number;
  applicant_id: string | number;
  status: string;
  submitted_at: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  civil_status: string | null;
  maiden_name: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  religion: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birthplace: string | null;
  house_street: string | null;
  town: string | null;
  barangay: string | null;
  father_name: string | null;
  father_occupation: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  mother_contact: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  primary_school: string | null;
  primary_address: string | null;
  primary_year_graduated: string | null;
  secondary_school: string | null;
  secondary_address: string | null;
  secondary_year_graduated: string | null;
  tertiary_school: string | null;
  tertiary_address: string | null;
  tertiary_year_graduated: string | null;
  tertiary_program: string | null;
}

interface RequirementSummary {
  requirement_key: string;
  status: string;
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

export default function StaffApplicantsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("applications");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [missingSession, setMissingSession] = useState(false);
  const [modalApplicant, setModalApplicant] = useState<Application | null>(
    null,
  );
  const [detailCache, setDetailCache] = useState<
    Record<string, { app: ApplicationDetail; reqs: RequirementSummary[] }>
  >({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [activeInfoTab, setActiveInfoTab] = useState<
    "personal" | "parents" | "education"
  >("personal");

  const staffId =
    typeof window !== "undefined" ? localStorage.getItem("staffId") : null;

  const { user } = useStaffSession();
  const assignedSchool = user?.assignedSchool ?? null;

  const fetchApplicants = useCallback(async () => {
    if (!staffId) {
      setMissingSession(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/staff/applicants?${params.toString()}`, {
        headers: { "x-validator-id": staffId },
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
  }, [staffId, search]);

  const fetchApplications = useCallback(async () => {
    if (!staffId) {
      setMissingSession(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(
        `/api/staff/applicants?view=applications&${params.toString()}`,
        { headers: { "x-validator-id": staffId } },
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
  }, [staffId, statusFilter, search]);

  const fetchData =
    viewMode === "applications" ? fetchApplications : fetchApplicants;

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const fetchDetail = useCallback(
    async (applicationId: string | number) => {
      if (!staffId) return;
      const key = String(applicationId);
      if (detailCache[key]) return;
      setDetailLoading(key);
      try {
        const res = await fetch(`/api/staff/applications/${applicationId}`, {
          headers: { "x-validator-id": staffId },
        });
        if (res.ok) {
          const json = await res.json();
          setDetailCache((prev) => ({
            ...prev,
            [key]: {
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

  const openModal = (application: Application) => {
    setModalApplicant(application);
    setActiveInfoTab("personal");
    fetchDetail(application.id);
  };

  const detailKey = modalApplicant ? String(modalApplicant.id) : null;
  const detail = detailKey ? detailCache[detailKey] : null;
  const isLoadingDetail = detailKey ? detailLoading === detailKey : false;

  if (missingSession) {
    return (
      <Card padding="lg">
        <div className="text-center py-10">
          <AlertCircle className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-40" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Session Required
          </h3>
          <p className="font-body text-sm text-muted-fg mb-4">
            Please sign in again to load staff applicants.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go to Login
          </Button>
        </div>
      </Card>
    );
  }

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
              ? `application${total !== 1 ? "s" : ""} ${
                  assignedSchool
                    ? `for ${assignedSchool}`
                    : "across all schools"
                }`
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
                const schoolLabel = app.school || app.barangay;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card hover padding="md">
                      <button
                        type="button"
                        onClick={() => openModal(app)}
                        className="flex flex-col md:flex-row md:items-center gap-4 w-full text-left"
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
                            {schoolLabel && (
                              <p className="text-[11px] font-body text-muted-fg truncate">
                                {schoolLabel}
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
                      </button>
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
              className="bg-card-bg border border-card-border rounded-2xl shadow-soft-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
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

              <div className="px-5 py-4 space-y-4 overflow-y-auto">
                {isLoadingDetail && !detail ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-fg font-body">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading details...
                  </div>
                ) : detail ? (
                  <>
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
                        icon={MapPin}
                        label="Address"
                        value={formatAddress(detail.app) || "Not provided"}
                      />
                    </div>

                    <div className="pt-3 border-t border-card-border">
                      <h3 className="text-xs font-heading font-semibold text-muted-fg uppercase tracking-wider mb-3">
                        Basic Information
                      </h3>
                      <div className="flex gap-1 border-b border-card-border mb-4">
                        {[
                          {
                            key: "personal" as const,
                            label: "Personal",
                            icon: User,
                          },
                          {
                            key: "parents" as const,
                            label: "Parents",
                            icon: Heart,
                          },
                          {
                            key: "education" as const,
                            label: "Education",
                            icon: GraduationCap,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveInfoTab(tab.key)}
                            className={`
                              px-3 py-2 text-xs font-body font-medium transition-colors relative flex items-center gap-1.5
                              ${
                                activeInfoTab === tab.key
                                  ? "text-foreground"
                                  : "text-ocean-400 hover:text-ocean-500"
                              }
                            `}
                          >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {activeInfoTab === tab.key && (
                              <motion.div
                                layoutId="staff-modal-info-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-ocean-400"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {activeInfoTab === "personal" && (
                        <div className="space-y-4">
                          <SectionTitle>Basic Details</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Birthdate"
                              value={formatDate(detail.app.date_of_birth)}
                            />
                            <InfoRow label="Gender" value={detail.app.gender} />
                            <InfoRow
                              label="Blood Type"
                              value={detail.app.blood_type}
                            />
                            <InfoRow
                              label="Civil Status"
                              value={detail.app.civil_status}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Maiden Name"
                              value={detail.app.maiden_name}
                            />
                            <InfoRow
                              label="Spouse Name"
                              value={detail.app.spouse_name}
                            />
                            <InfoRow
                              label="Spouse Occupation"
                              value={detail.app.spouse_occupation}
                            />
                            <InfoRow
                              label="Religion"
                              value={detail.app.religion}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Height"
                              value={
                                detail.app.height_cm != null
                                  ? `${detail.app.height_cm} cm`
                                  : null
                              }
                            />
                            <InfoRow
                              label="Weight"
                              value={
                                detail.app.weight_kg != null
                                  ? `${detail.app.weight_kg} kg`
                                  : null
                              }
                            />
                            <InfoRow
                              label="Birthplace"
                              value={detail.app.birthplace}
                            />
                            <InfoRow
                              label="Contact Number"
                              value={detail.app.contact_number}
                            />
                          </div>
                          <SectionTitle>Address</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="House/Unit/Street"
                              value={detail.app.house_street}
                            />
                            <InfoRow label="Town" value={detail.app.town} />
                            <InfoRow
                              label="Barangay"
                              value={detail.app.barangay}
                            />
                          </div>
                        </div>
                      )}

                      {activeInfoTab === "parents" && (
                        <div className="space-y-4">
                          <SectionTitle>Father&apos;s Information</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Full Name"
                              value={detail.app.father_name}
                            />
                            <InfoRow
                              label="Occupation"
                              value={detail.app.father_occupation}
                            />
                            <InfoRow
                              label="Contact Number"
                              value={detail.app.father_contact}
                            />
                          </div>
                          <SectionTitle>Mother&apos;s Information</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Full Name"
                              value={detail.app.mother_name}
                            />
                            <InfoRow
                              label="Occupation"
                              value={detail.app.mother_occupation}
                            />
                            <InfoRow
                              label="Contact Number"
                              value={detail.app.mother_contact}
                            />
                          </div>
                          <SectionTitle>
                            Guardian&apos;s Information
                          </SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="Full Name"
                              value={detail.app.guardian_name}
                            />
                            <InfoRow
                              label="Relationship"
                              value={detail.app.guardian_relation}
                            />
                            <InfoRow
                              label="Contact Number"
                              value={detail.app.guardian_contact}
                            />
                          </div>
                        </div>
                      )}

                      {activeInfoTab === "education" && (
                        <div className="space-y-4">
                          <SectionTitle>Primary</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="School Name"
                              value={detail.app.primary_school}
                            />
                            <InfoRow
                              label="Address"
                              value={detail.app.primary_address}
                            />
                            <InfoRow
                              label="Year Graduated"
                              value={detail.app.primary_year_graduated}
                            />
                          </div>
                          <SectionTitle>Secondary</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                            <InfoRow
                              label="School Name"
                              value={detail.app.secondary_school}
                            />
                            <InfoRow
                              label="Address"
                              value={detail.app.secondary_address}
                            />
                            <InfoRow
                              label="Year Graduated"
                              value={detail.app.secondary_year_graduated}
                            />
                          </div>
                          <SectionTitle>Tertiary (Post-Secondary)</SectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                            <InfoRow
                              label="School Name"
                              value={detail.app.tertiary_school}
                            />
                            <InfoRow
                              label="Program"
                              value={detail.app.tertiary_program}
                            />
                            <InfoRow
                              label="Address"
                              value={detail.app.tertiary_address}
                            />
                            <InfoRow
                              label="Year Graduated"
                              value={detail.app.tertiary_year_graduated}
                            />
                          </div>
                        </div>
                      )}
                    </div>

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
                              - {r.status}
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
                <Link href={`/staff/validate/${modalApplicant.id}`}>
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
    </motion.div>
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function formatAddress(app: ApplicationDetail): string | null {
  const parts = [app.house_street, app.barangay, app.town].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  const structured = parts.join(", ");
  const fallback = app.address?.trim() || "";

  if (fallback && (!structured || fallback.length >= structured.length)) {
    return fallback;
  }

  return structured || null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-heading text-sm font-semibold text-foreground border-b border-card-border pb-1">
      {children}
    </h4>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-body text-muted-fg">{label}</p>
      <p className="text-sm font-body font-medium text-foreground mt-0.5">
        {value || "-"}
      </p>
    </div>
  );
}
