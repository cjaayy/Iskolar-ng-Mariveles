/* ================================================================
   ADMIN — REGISTERED APPLICANT DETAIL (Read-Only)
   View a single application's documents, applicant info, and
   validation history.
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Eye,
  Download,
  ExternalLink,
  Image as ImageIcon,
  User,
  Heart,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { Card, Badge, Button, Skeleton } from "@/components/ui";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

/* -- Types -- */
interface ApplicationDetail {
  id: number;
  applicant_id: number;
  status: string;
  gpa_at_submission: number | null;
  income_at_submission: number | null;
  submitted_at: string | null;
  remarks: string | null;
  applicant_name: string;
  applicant_email: string;
  student_number: string;
  gpa: number;
  year_level: number;
  course: string;
  college: string;
  monthly_income: number;
  household_size: number;
  contact_number: string | null;
  address: string | null;
  scholarship_name: string;
  grantor: string;
  min_gpa: number;
  max_monthly_income: number | null;
  slots_available: number;
  slots_total: number;
  /* basic info – personal */
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
  /* basic info – parents */
  father_name: string | null;
  father_occupation: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  mother_contact: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  /* basic info – education */
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
  /* basic info – others */
  skills: string | null;
  hobbies: string | null;
  organizations: string | null;
  awards: string | null;
}

interface RequirementSubmission {
  id: number;
  application_id: number;
  requirement_key: string;
  status: string;
  progress: number;
  file_name: string | null;
  file_url: string | null;
  uploaded_at: string | null;
  notes: string | null;
  validated_by: number | null;
  validated_at: string | null;
  validator_notes: string | null;
  validator_name: string | null;
}

interface ValidationHistory {
  id: number;
  action: string;
  notes: string | null;
  created_at: string;
  validator_name: string;
}

/* -- Status configs -- */
const appStatusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "neutral";
  }
> = {
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
  returned: { label: "Returned", variant: "neutral" },
  draft: { label: "Draft", variant: "neutral" },
};

const docStatusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "neutral";
    icon: typeof CheckCircle2;
  }
> = {
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  pending: { label: "Pending Review", variant: "warning", icon: Clock },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
  missing: { label: "Not Submitted", variant: "neutral", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "info", icon: Clock },
};

/* -- Build requirement key → config map -- */
const reqConfigMap = Object.fromEntries(
  REQUIREMENT_CONFIGS.map((c) => [c.key, c]),
);

/* -- Animations -- */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function AdminRegisteredDetailPage() {
  const params = useParams();
  const applicationId = Number(params.id);

  const [application, setApplication] = useState<ApplicationDetail | null>(
    null,
  );
  const [requirements, setRequirements] = useState<RequirementSubmission[]>([]);
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<RequirementSubmission | null>(
    null,
  );
  const [activeInfoTab, setActiveInfoTab] = useState<
    "personal" | "parents" | "education" | "others"
  >("personal");

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`/api/admin/registered/${applicationId}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setApplication(json.data);
        setRequirements(json.requirements);
        setHistory(json.history);
      }
    } catch (e) {
      console.error("Failed to load application:", e);
    } finally {
      setLoading(false);
    }
  }, [adminId, applicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
          <Card padding="md">
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-40" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Application Not Found
          </h3>
          <p className="font-body text-sm text-muted-fg mb-4">
            This application may have been removed or does not exist.
          </p>
          <Link href="/admin/registered">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to List of Applicants
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const pendingDocs = requirements.filter((r) => r.status === "pending");
  const approvedDocs = requirements.filter((r) => r.status === "approved");
  const rejectedDocs = requirements.filter((r) => r.status === "rejected");
  const missingDocs = requirements.filter((r) => r.status === "missing");

  const appSt = appStatusConfig[application.status] ?? appStatusConfig.draft;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── Back Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/registered"
          className="inline-flex items-center gap-1 text-sm font-body text-muted-fg hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List of Applicants
        </Link>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {application.applicant_name}
              </h1>
              <Badge variant={appSt.variant} dot>
                {appSt.label}
              </Badge>
            </div>
            <p className="font-body text-sm text-muted-fg">
              {application.scholarship_name} &middot; {application.grantor}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Basic Information ────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Basic Information
          </h2>

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-card-border mb-5">
            {[
              {
                key: "personal" as const,
                label: "Personal Information",
                icon: User,
              },
              { key: "parents" as const, label: "Parents", icon: Heart },
              {
                key: "education" as const,
                label: "Education",
                icon: GraduationCap,
              },
              { key: "others" as const, label: "Others", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveInfoTab(tab.key)}
                className={`
                  px-4 py-2.5 text-sm font-body font-medium transition-colors relative flex items-center gap-1.5
                  ${
                    activeInfoTab === tab.key
                      ? "text-foreground"
                      : "text-ocean-400 hover:text-ocean-500"
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeInfoTab === tab.key && (
                  <motion.div
                    layoutId="admin-info-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ocean-400"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeInfoTab === "personal" && (
            <div className="space-y-6">
              <SectionTitle>Basic Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoRow
                  label="Birthdate"
                  value={formatDate(application.date_of_birth)}
                />
                <InfoRow label="Gender" value={application.gender} />
                <InfoRow label="Blood Type" value={application.blood_type} />
                <InfoRow
                  label="Civil Status"
                  value={application.civil_status}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoRow label="Maiden Name" value={application.maiden_name} />
                <InfoRow label="Spouse Name" value={application.spouse_name} />
                <InfoRow
                  label="Spouse Occupation"
                  value={application.spouse_occupation}
                />
                <InfoRow label="Religion" value={application.religion} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoRow
                  label="Height"
                  value={
                    application.height_cm != null
                      ? `${application.height_cm} cm`
                      : null
                  }
                />
                <InfoRow
                  label="Weight"
                  value={
                    application.weight_kg != null
                      ? `${application.weight_kg} kg`
                      : null
                  }
                />
                <InfoRow label="Birthplace" value={application.birthplace} />
                <InfoRow
                  label="Contact Number"
                  value={application.contact_number}
                />
              </div>
              <SectionTitle>Address</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow
                  label="House/Unit/Street"
                  value={application.house_street}
                />
                <InfoRow label="Town" value={application.town} />
                <InfoRow label="Barangay" value={application.barangay} />
              </div>
            </div>
          )}

          {activeInfoTab === "parents" && (
            <div className="space-y-6">
              <SectionTitle>Father&rsquo;s Information</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow label="Full Name" value={application.father_name} />
                <InfoRow
                  label="Occupation"
                  value={application.father_occupation}
                />
                <InfoRow
                  label="Contact Number"
                  value={application.father_contact}
                />
              </div>
              <SectionTitle>Mother&rsquo;s Information</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow label="Full Name" value={application.mother_name} />
                <InfoRow
                  label="Occupation"
                  value={application.mother_occupation}
                />
                <InfoRow
                  label="Contact Number"
                  value={application.mother_contact}
                />
              </div>
              <SectionTitle>Guardian&rsquo;s Information</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow label="Full Name" value={application.guardian_name} />
                <InfoRow
                  label="Relationship"
                  value={application.guardian_relation}
                />
                <InfoRow
                  label="Contact Number"
                  value={application.guardian_contact}
                />
              </div>
            </div>
          )}

          {activeInfoTab === "education" && (
            <div className="space-y-6">
              <SectionTitle>Primary</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow
                  label="School Name"
                  value={application.primary_school}
                />
                <InfoRow label="Address" value={application.primary_address} />
                <InfoRow
                  label="Year Graduated"
                  value={application.primary_year_graduated}
                />
              </div>
              <SectionTitle>Secondary</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <InfoRow
                  label="School Name"
                  value={application.secondary_school}
                />
                <InfoRow
                  label="Address"
                  value={application.secondary_address}
                />
                <InfoRow
                  label="Year Graduated"
                  value={application.secondary_year_graduated}
                />
              </div>
              <SectionTitle>Tertiary (Post-Secondary)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow
                  label="School Name"
                  value={application.tertiary_school}
                />
                <InfoRow label="Program" value={application.tertiary_program} />
                <InfoRow label="Address" value={application.tertiary_address} />
                <InfoRow
                  label="Year Graduated"
                  value={application.tertiary_year_graduated}
                />
              </div>
            </div>
          )}

          {activeInfoTab === "others" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoBlock label="Skills" value={application.skills} />
                <InfoBlock label="Hobbies" value={application.hobbies} />
                <InfoBlock
                  label="Organizations"
                  value={application.organizations}
                />
                <InfoBlock
                  label="Awards & Achievements"
                  value={application.awards}
                />
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Documents ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary bar */}
          <Card padding="sm">
            <div className="flex items-center gap-4 flex-wrap px-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-fg" />
                <span className="text-sm font-body text-muted-fg">
                  {requirements.length} total requirements
                </span>
              </div>
              <span className="text-card-border">|</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-fg" />
                <span className="text-sm font-body text-muted-fg">
                  {pendingDocs.length} pending
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-fg" />
                <span className="text-sm font-body text-muted-fg">
                  {approvedDocs.length} approved
                </span>
              </div>
              {rejectedDocs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-muted-fg" />
                  <span className="text-sm font-body text-coral-500">
                    {rejectedDocs.length} rejected
                  </span>
                </div>
              )}
              {missingDocs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-fg" />
                  <span className="text-sm font-body text-muted-fg">
                    {missingDocs.length} not submitted
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Document Cards */}
          {requirements.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-30" />
                <p className="font-body text-muted-fg">
                  No requirements configured.
                </p>
              </div>
            </Card>
          ) : (
            requirements.map((req, idx) => {
              const config = reqConfigMap[req.requirement_key];
              const statusCfg =
                docStatusConfig[req.status] ?? docStatusConfig.missing;
              const isMissing = req.status === "missing";
              const isPending = req.status === "pending";
              const isValidated =
                req.status === "approved" || req.status === "rejected";

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    padding="md"
                    className={`${
                      isMissing
                        ? "opacity-60"
                        : isPending
                          ? "border-l-4 border-l-amber-400"
                          : req.status === "approved"
                            ? "border-l-4 border-l-sage-400"
                            : req.status === "rejected"
                              ? "border-l-4 border-l-coral-400"
                              : ""
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Document header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isPending
                                ? "bg-amber-100 dark:bg-amber-500/20"
                                : req.status === "approved"
                                  ? "bg-sage-100 dark:bg-sage-500/20"
                                  : req.status === "rejected"
                                    ? "bg-coral-100 dark:bg-coral-500/20"
                                    : "bg-muted"
                            }`}
                          >
                            <FileText className="w-4 h-4 text-muted-fg" />
                          </div>
                          <div>
                            <h3 className="font-body font-medium text-foreground text-sm">
                              {config?.name ?? req.requirement_key}
                            </h3>
                            <p className="text-xs font-body text-muted-fg mt-0.5">
                              {config?.description ?? "Document requirement"}
                            </p>
                            {req.file_name && (
                              <p className="text-xs font-body text-ocean-400 mt-1">
                                File: {req.file_name}
                              </p>
                            )}
                            {req.uploaded_at && (
                              <p className="text-[11px] font-body text-muted-fg mt-0.5">
                                Uploaded:{" "}
                                {new Date(req.uploaded_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={statusCfg.variant} dot>
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {/* Document View / Download actions */}
                      {req.file_url && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewDoc(req)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            View Document
                          </Button>
                          <a
                            href={req.file_url}
                            download={req.file_name ?? "document"}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-muted-fg bg-muted hover:bg-card-border hover:text-foreground transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                          <a
                            href={req.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-ocean-400 hover:text-ocean-500 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open in New Tab
                          </a>
                        </div>
                      )}
                      {!req.file_url && req.file_name && (
                        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                          <p className="text-xs font-body text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            File was submitted but the document file is not
                            available for preview.
                          </p>
                        </div>
                      )}

                      {/* Validator info (if already reviewed) */}
                      {isValidated && req.validator_name && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-muted-fg" />
                          <span className="text-xs font-body text-muted-fg">
                            Reviewed by <strong>{req.validator_name}</strong>
                            {req.validated_at &&
                              ` on ${new Date(req.validated_at).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      {isValidated && req.validator_notes && (
                        <div className="px-3 py-2 bg-muted/50 rounded-lg">
                          <p className="text-xs font-body text-muted-fg italic">
                            &ldquo;{req.validator_notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Right: Sidebar ─────────────────── */}
        <div className="space-y-4">
          {/* Validation History */}
          {history.length > 0 && (
            <Card padding="md">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-muted-fg" />
                Review History
              </h3>
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex gap-3 pb-3 border-b border-card-border last:border-0 last:pb-0"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        h.action === "approved"
                          ? "bg-sage-100 dark:bg-sage-500/20"
                          : h.action === "rejected"
                            ? "bg-coral-100 dark:bg-coral-500/20"
                            : "bg-muted"
                      }`}
                    >
                      {h.action === "approved" ? (
                        <Check className="w-3 h-3 text-muted-fg" />
                      ) : h.action === "rejected" ? (
                        <X className="w-3 h-3 text-muted-fg" />
                      ) : (
                        <Clock className="w-3 h-3 text-muted-fg" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-body text-foreground">
                        <strong>{h.validator_name}</strong>{" "}
                        <span className="text-muted-fg">
                          {h.action === "approved"
                            ? "approved"
                            : h.action === "rejected"
                              ? "rejected"
                              : h.action}{" "}
                          the application
                        </span>
                      </p>
                      {h.notes && (
                        <p className="text-xs font-body text-muted-fg mt-0.5 italic">
                          &ldquo;{h.notes}&rdquo;
                        </p>
                      )}
                      <p className="text-[10px] font-body text-muted-fg mt-0.5">
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Document Preview Modal ───────────────────────────── */}
      <AnimatePresence>
        {previewDoc && previewDoc.file_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setPreviewDoc(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Document preview"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-card-bg border border-card-border rounded-2xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b border-card-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-ocean-100 dark:bg-ocean-500/20 flex items-center justify-center shrink-0">
                    {previewDoc.file_url.match(
                      /\.(png|jpg|jpeg|gif|webp)$/i,
                    ) ? (
                      <ImageIcon className="w-4 h-4 text-muted-fg" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-fg" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                      {reqConfigMap[previewDoc.requirement_key]?.name ??
                        previewDoc.requirement_key}
                    </h3>
                    <p className="text-xs font-body text-muted-fg truncate">
                      {previewDoc.file_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.file_url}
                    download={previewDoc.file_name ?? "document"}
                    className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-auto bg-muted/30">
                {previewDoc.file_url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                  <div className="flex items-center justify-center p-6 min-h-[400px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewDoc.file_url}
                      alt={previewDoc.file_name ?? "Document preview"}
                      className="max-w-full max-h-[70vh] rounded-lg shadow-soft object-contain"
                    />
                  </div>
                ) : previewDoc.file_url.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDoc.file_url}
                    title={previewDoc.file_name ?? "PDF preview"}
                    className="w-full h-[70vh] border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center">
                    <FileText className="w-16 h-16 text-muted-fg opacity-30 mb-4" />
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-1">
                      Preview Not Available
                    </h4>
                    <p className="font-body text-sm text-muted-fg mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    <a
                      href={previewDoc.file_url}
                      download={previewDoc.file_name ?? "document"}
                    >
                      <Button leftIcon={<Download className="w-4 h-4" />}>
                        Download File
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ======================== BASIC INFO HELPER COMPONENTS ======================== */

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-base font-semibold text-foreground border-b border-card-border pb-2">
      {children}
    </h3>
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
        {value || "—"}
      </p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-body text-muted-fg mb-1">{label}</p>
      <div className="bg-muted rounded-xl px-4 py-3 min-h-[60px]">
        <p className="text-sm font-body text-foreground whitespace-pre-wrap">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
