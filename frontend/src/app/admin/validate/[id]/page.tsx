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
  ShieldCheck,
  AlertCircle,
  Check,
  X,
  Eye,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { Card, Badge, Button, Skeleton } from "@/components/ui";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface ApplicationDetail {
  id: number;
  applicant_id: number;
  status: string;
  income_at_submission: number | null;
  submitted_at: string | null;
  remarks: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  address: string | null;
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

const reqConfigMap = Object.fromEntries(
  REQUIREMENT_CONFIGS.map((c) => [c.key, c]),
);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function AdminValidateDetailPage() {
  const params = useParams();
  const applicationId = Number(params.id);

  const [application, setApplication] = useState<ApplicationDetail | null>(
    null,
  );
  const [requirements, setRequirements] = useState<RequirementSubmission[]>([]);
  const [history, setHistory] = useState<ValidationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({});
  const [validating, setValidating] = useState<Record<number, boolean>>({});
  const [bulkAction, setBulkAction] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<RequirementSubmission | null>(
    null,
  );

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`/api/admin/validations/${applicationId}`, {
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

  const handleValidateDoc = async (
    submissionId: number,
    action: "approved" | "rejected",
  ) => {
    if (!adminId) return;
    setValidating((prev) => ({ ...prev, [submissionId]: true }));

    try {
      const res = await fetch("/api/admin/validations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          submissionId,
          action,
          notes: actionNotes[submissionId] || null,
        }),
      });

      if (res.ok) {
        await fetchData();
        setActionNotes((prev) => {
          const next = { ...prev };
          delete next[submissionId];
          return next;
        });
      }
    } catch (e) {
      console.error("Validation failed:", e);
    } finally {
      setValidating((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleBulkValidate = async () => {
    if (!adminId || !bulkAction) return;
    setBulkLoading(true);

    try {
      const res = await fetch("/api/admin/validations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          applicationId,
          action: bulkAction,
          notes: bulkNotes || null,
        }),
      });

      if (res.ok) {
        await fetchData();
        setBulkAction(null);
        setBulkNotes("");
      }
    } catch (e) {
      console.error("Bulk validation failed:", e);
    } finally {
      setBulkLoading(false);
    }
  };

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
          <Link href="/admin/validate">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to List
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/admin/validate"
          className="inline-flex items-center gap-1 text-sm font-body text-muted-fg hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
              Document Validation
            </h1>
            <p className="font-body text-sm text-muted-fg">
              {application.applicant_name} &middot; Iskolar ng Mariveles
            </p>
          </div>

          {pendingDocs.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setBulkAction("approved")}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-sage-400 hover:bg-sage-500 text-white"
              >
                Approve All ({pendingDocs.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("rejected")}
                leftIcon={<XCircle className="w-4 h-4" />}
                className="border-coral-300 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-500/10"
              >
                Reject All
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {bulkAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card
              padding="md"
              className={`border-2 ${
                bulkAction === "approved"
                  ? "border-sage-300 bg-sage-50/50 dark:bg-sage-400/5"
                  : "border-coral-300 bg-coral-50/50 dark:bg-coral-400/5"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {bulkAction === "approved" ? (
                    <CheckCircle2 className="w-5 h-5 text-muted-fg" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-fg" />
                  )}
                  <h3 className="font-heading font-semibold text-foreground">
                    {bulkAction === "approved"
                      ? "Approve All Pending Documents"
                      : "Reject All Pending Documents"}
                  </h3>
                </div>
                <p className="text-sm font-body text-muted-fg">
                  This will {bulkAction === "approved" ? "approve" : "reject"}{" "}
                  <strong>{pendingDocs.length}</strong> pending document(s). Add
                  optional notes below.
                </p>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  rows={3}
                  className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction(null);
                      setBulkNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    isLoading={bulkLoading}
                    onClick={handleBulkValidate}
                    className={
                      bulkAction === "approved"
                        ? "bg-sage-400 hover:bg-sage-500 text-white"
                        : "bg-coral-400 hover:bg-coral-500 text-white"
                    }
                  >
                    Confirm {bulkAction === "approved" ? "Approve" : "Reject"}{" "}
                    All
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
              const isPending = req.status === "pending";
              const isMissing = req.status === "missing";
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

                      {isValidated && req.validator_name && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5 text-muted-fg" />
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

                      {isPending && (
                        <div className="space-y-3 pt-2 border-t border-card-border">
                          <div>
                            <label className="text-xs font-body text-muted-fg mb-1 block">
                              Feedback / Notes (optional)
                            </label>
                            <textarea
                              value={actionNotes[req.id] ?? ""}
                              onChange={(e) =>
                                setActionNotes((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value,
                                }))
                              }
                              placeholder="Add feedback for the applicant..."
                              rows={2}
                              className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleValidateDoc(req.id, "approved")
                              }
                              isLoading={validating[req.id]}
                              leftIcon={<Check className="w-4 h-4" />}
                              className="bg-sage-400 hover:bg-sage-500 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleValidateDoc(req.id, "rejected")
                              }
                              isLoading={validating[req.id]}
                              leftIcon={<X className="w-4 h-4" />}
                              className="border-coral-300 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-500/10"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
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

              {previewDoc.status === "pending" && (
                <div className="p-4 border-t border-card-border shrink-0 bg-card-bg">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-body text-muted-fg">
                      Review this document:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleValidateDoc(previewDoc.id, "approved");
                          setPreviewDoc(null);
                        }}
                        leftIcon={<Check className="w-4 h-4" />}
                        className="bg-sage-400 hover:bg-sage-500 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleValidateDoc(previewDoc.id, "rejected");
                          setPreviewDoc(null);
                        }}
                        leftIcon={<X className="w-4 h-4" />}
                        className="border-coral-300 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-500/10"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
