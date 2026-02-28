/* ================================================================
   REQUIREMENTS TRACKER PAGE
   Interactive checklist, filters, upload, sample docs, grouping
   ================================================================ */

"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  XCircle,
  FileText,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  Badge,
  ProgressBar,
  Button,
  Breadcrumb,
  Checkbox,
  HelpTip,
} from "@/components/ui";
import { EmptyStateIllustration } from "@/components/illustrations";
import { DocumentUploadModal } from "@/components/requirements/DocumentUploadModal";
import {
  useSession,
  DEMO_APPLICANT_ID,
} from "@/components/providers/SessionProvider";

/* -- Types -- */
type RequirementStatus =
  | "approved"
  | "pending"
  | "in-progress"
  | "missing"
  | "rejected";
type FilterType = "all" | RequirementStatus;

interface Requirement {
  id: number;
  key: string;
  name: string;
  description: string;
  status: RequirementStatus;
  progress: number;
  dueDate: string;
  helpTip: string;
  sampleUrl?: string;
  uploadedFile?: string;
  group: "personal" | "academic" | "financial";
  validatorNotes?: string | null;
  validatedAt?: string | null;
}

/* -- Mock Data removed – loaded from /api/me/requirements -- */

const statusConfig: Record<
  RequirementStatus,
  {
    label: string;
    variant: "success" | "warning" | "info" | "error";
    icon: typeof CheckCircle2;
  }
> = {
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  pending: { label: "Pending Review", variant: "warning", icon: Clock },
  "in-progress": { label: "In Progress", variant: "info", icon: TrendingUp },
  missing: { label: "Missing", variant: "error", icon: AlertCircle },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
};

const groupLabels = {
  personal: "Personal Documents",
  academic: "Academic Records",
  financial: "Financial Documents",
};

const groupIcons = {
  personal: "👤",
  academic: "📚",
  financial: "💰",
};

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

/* ======================== REQUIREMENTS PAGE ======================== */

export default function RequirementsPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      personal: true,
      academic: true,
      financial: true,
    },
  );
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    name?: string;
    reqKey?: string;
  }>({ open: false });
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Load requirements from API on mount
  const loadRequirements = useCallback(async () => {
    try {
      const res = await fetch("/api/me/requirements", {
        headers: { "x-applicant-id": String(DEMO_APPLICANT_ID) },
      });
      if (res.ok) {
        const data = await res.json();
        const reqs: Requirement[] = data.requirements ?? [];
        setRequirements(reqs);
        // Pre-check approved items
        setCheckedItems(
          new Set(reqs.filter((r) => r.status === "approved").map((r) => r.id)),
        );
      }
    } catch (e) {
      console.error("[Requirements] Failed to load", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  void user; // session available for future auth gating

  /* Filtered requirements */
  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter;
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery, requirements]);

  /* Grouped */
  const grouped = useMemo(() => {
    const groups: Record<string, Requirement[]> = {
      personal: [],
      academic: [],
      financial: [],
    };
    filtered.forEach((r) => groups[r.group].push(r));
    return groups;
  }, [filtered]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const overallProgress =
    requirements.length > 0
      ? Math.round(
          requirements.reduce((sum, r) => sum + r.progress, 0) /
            requirements.length,
        )
      : 0;

  const filterCounts: Record<FilterType, number> = {
    all: requirements.length,
    approved: requirements.filter((r) => r.status === "approved").length,
    pending: requirements.filter((r) => r.status === "pending").length,
    "in-progress": requirements.filter((r) => r.status === "in-progress")
      .length,
    missing: requirements.filter((r) => r.status === "missing").length,
    rejected: requirements.filter((r) => r.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-body text-muted-fg">
            Loading requirements…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Breadcrumb */}
        <motion.div variants={fadeUp}>
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Requirements" },
            ]}
          />
        </motion.div>

        {/* Page Header */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Requirements Tracker
            </h1>
            <p className="font-body text-sm text-muted-fg mt-1">
              Track and upload all your scholarship documents in one place.
            </p>
          </div>
          <Button
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setUploadModal({ open: true })}
          >
            Upload Document
          </Button>
        </motion.div>

        {/* Overall Progress */}
        <motion.div variants={fadeUp}>
          <Card>
            <ProgressBar
              value={overallProgress}
              label="Overall Completion"
              size="lg"
              color={
                overallProgress >= 80
                  ? "sage"
                  : overallProgress >= 50
                    ? "ocean"
                    : "amber"
              }
            />
            <p className="mt-2 text-xs font-body text-muted-fg">
              {filterCounts.approved} of {filterCounts.all} requirements
              completed
            </p>
          </Card>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requirements..."
              className="w-full bg-input-bg border-2 border-input-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20 transition-all"
              aria-label="Search requirements"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-fg flex-shrink-0" />
            {(
              [
                "all",
                "approved",
                "pending",
                "in-progress",
                "missing",
                "rejected",
              ] as FilterType[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap
                  transition-all duration-200
                  ${
                    filter === f
                      ? "bg-ocean-400 text-white shadow-soft"
                      : "bg-muted text-muted-fg hover:bg-card-border hover:text-foreground"
                  }
                `}
                aria-pressed={filter === f}
              >
                {f === "all" ? "All" : statusConfig[f].label} ({filterCounts[f]}
                )
              </button>
            ))}
          </div>
        </motion.div>

        {/* Requirements Groups */}
        {(Object.entries(grouped) as [string, Requirement[]][]).map(
          ([group, items]) => {
            if (items.length === 0) return null;
            const isExpanded = expandedGroups[group];

            return (
              <motion.div key={group} variants={fadeUp} className="space-y-3">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="flex items-center gap-2 w-full text-left group"
                  aria-expanded={isExpanded}
                >
                  <span className="text-lg" aria-hidden="true">
                    {groupIcons[group as keyof typeof groupIcons]}
                  </span>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    {groupLabels[group as keyof typeof groupLabels]}
                  </h2>
                  <Badge variant="neutral" className="ml-1">
                    {items.length}
                  </Badge>
                  <div className="flex-1" />
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-fg group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-fg group-hover:text-foreground transition-colors" />
                  )}
                </button>

                {/* Requirements List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {items.map((req) => (
                        <RequirementRow
                          key={req.id}
                          requirement={req}
                          isChecked={checkedItems.has(req.id)}
                          onToggle={() => toggleCheck(req.id)}
                          onUpload={() =>
                            setUploadModal({
                              open: true,
                              name: req.name,
                              reqKey: req.key,
                            })
                          }
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          },
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <EmptyStateIllustration className="mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
              No requirements found
            </h3>
            <p className="font-body text-sm text-muted-fg mb-4">
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false })}
        requirementName={uploadModal.name}
        requirementKey={uploadModal.reqKey}
        applicantId={DEMO_APPLICANT_ID}
        onSuccess={loadRequirements}
      />
    </>
  );
}

/* ======================== REQUIREMENT ROW COMPONENT ======================== */

function RequirementRow({
  requirement: req,
  isChecked,
  onToggle,
  onUpload,
}: {
  requirement: Requirement;
  isChecked: boolean;
  onToggle: () => void;
  onUpload: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[req.status] ?? statusConfig.missing;
  // StatusIcon available via config.icon if needed
  const dueDate = new Date(req.dueDate);
  const isOverdue = dueDate < new Date() && req.status !== "approved";
  const daysDiff = Math.ceil(
    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isRejected = req.status === "rejected";

  return (
    <Card
      padding="none"
      hover
      className={`overflow-hidden ${isRejected ? "ring-2 ring-coral-400/30" : ""}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox checked={isChecked} onChange={onToggle} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3
                  className={`font-body font-medium text-sm ${isChecked ? "line-through text-muted-fg" : "text-foreground"}`}
                >
                  {req.name}
                </h3>
                <HelpTip content={req.helpTip} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={config.variant} dot>
                  {config.label}
                </Badge>
              </div>
            </div>

            {/* Rejection reason banner */}
            {isRejected && req.validatorNotes && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20"
              >
                <MessageSquare className="w-4 h-4 text-coral-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-semibold text-coral-500 dark:text-coral-400 mb-0.5">
                    Reason for Rejection
                  </p>
                  <p className="text-sm font-body text-coral-600 dark:text-coral-300">
                    {req.validatorNotes}
                  </p>
                  {req.validatedAt && (
                    <p className="text-xs font-body text-coral-400 mt-1">
                      Rejected on{" "}
                      {new Date(req.validatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {isRejected && !req.validatorNotes && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20"
              >
                <XCircle className="w-4 h-4 text-coral-400 flex-shrink-0" />
                <p className="text-sm font-body text-coral-500 dark:text-coral-400">
                  This document was rejected. Please re-upload a corrected
                  version.
                </p>
              </motion.div>
            )}

            {/* Progress */}
            <div className="mt-3">
              <ProgressBar
                value={isRejected ? 0 : req.progress}
                size="sm"
                showValue
                color={
                  req.status === "approved"
                    ? "sage"
                    : req.status === "missing" || isRejected
                      ? "coral"
                      : "ocean"
                }
              />
            </div>

            {/* Due date + actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-fg" />
                <span
                  className={`text-xs font-body ${isOverdue ? "text-coral-400 font-medium" : "text-muted-fg"}`}
                >
                  {isOverdue ? "Overdue! " : ""}
                  Due{" "}
                  {dueDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {!isOverdue && daysDiff <= 7 && daysDiff > 0 && (
                    <span className="text-amber-500 ml-1">
                      ({daysDiff} days left)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {req.sampleUrl && (
                  <button className="text-xs font-body text-ocean-400 hover:text-ocean-500 flex items-center gap-1 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    View Sample
                  </button>
                )}

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-body text-muted-fg hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  Details
                  {expanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {isRejected ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={onUpload}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="!bg-coral-400 hover:!bg-coral-500"
                  >
                    Re-upload
                  </Button>
                ) : (
                  req.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onUpload}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Upload
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-card-border"
          >
            <div className="p-4 sm:p-5 bg-muted/30 space-y-3">
              <p className="font-body text-sm text-muted-fg">
                {req.description}
              </p>

              {req.uploadedFile && (
                <div className="flex items-center gap-2 text-sm font-body">
                  <FileText className="w-4 h-4 text-ocean-400" />
                  <span className="text-foreground">{req.uploadedFile}</span>
                  <button className="text-ocean-400 hover:text-ocean-500 text-xs flex items-center gap-0.5">
                    <ExternalLink className="w-3 h-3" /> View
                  </button>
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs font-body text-muted-fg flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-ocean-400" />
                  <strong className="text-foreground">Tip:</strong>{" "}
                  {req.helpTip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
