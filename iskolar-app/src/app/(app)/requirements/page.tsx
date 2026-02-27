/* ================================================================
   REQUIREMENTS TRACKER PAGE
   Interactive checklist, filters, upload, sample docs, grouping
   ================================================================ */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Card,
  Badge,
  ProgressBar,
  Button,
  Breadcrumb,
  Checkbox,
  HelpTip,
  Skeleton,
} from "@/components/ui";
import { EmptyStateIllustration } from "@/components/illustrations";
import { DocumentUploadModal } from "@/components/requirements/DocumentUploadModal";

/* -- Types -- */
type RequirementStatus = "approved" | "pending" | "in-progress" | "missing";
type FilterType = "all" | RequirementStatus;

interface Requirement {
  id: number;
  name: string;
  description: string;
  status: RequirementStatus;
  progress: number;
  dueDate: string;
  helpTip: string;
  sampleUrl?: string;
  uploadedFile?: string;
  group: "personal" | "academic" | "financial";
}

/* -- Mock Data -- */
const requirements: Requirement[] = [
  {
    id: 1,
    name: "Enrollment Certificate",
    description: "Official certificate from the registrar confirming current enrollment status.",
    status: "approved",
    progress: 100,
    dueDate: "2026-03-10",
    helpTip: "Request this from your school's registrar office. Usually ready within 2-3 business days.",
    sampleUrl: "#",
    uploadedFile: "enrollment_cert_2026.pdf",
    group: "academic",
  },
  {
    id: 2,
    name: "Certificate of Grades",
    description: "Official transcript or grade report for the most recent semester.",
    status: "pending",
    progress: 100,
    dueDate: "2026-03-15",
    helpTip: "Must show all subjects for the current semester with your general weighted average.",
    sampleUrl: "#",
    uploadedFile: "grades_2025_2026.pdf",
    group: "academic",
  },
  {
    id: 3,
    name: "Income Tax Return (ITR)",
    description: "Parent or guardian's latest ITR or Certificate of No Income.",
    status: "in-progress",
    progress: 50,
    dueDate: "2026-03-20",
    helpTip: "If your parent/guardian has no income, submit a notarized Certificate of No Income instead.",
    sampleUrl: "#",
    group: "financial",
  },
  {
    id: 4,
    name: "Barangay Certificate",
    description: "Certificate of residency from your local barangay hall.",
    status: "missing",
    progress: 0,
    dueDate: "2026-03-25",
    helpTip: "Visit your barangay hall with a valid ID. The certificate is usually free or minimal cost.",
    sampleUrl: "#",
    group: "personal",
  },
  {
    id: 5,
    name: "Community Service Log",
    description: "Completed community service hours with supervisor sign-off.",
    status: "in-progress",
    progress: 30,
    dueDate: "2026-04-01",
    helpTip: "Log at least 20 hours of community service. Each entry needs a supervisor signature.",
    group: "personal",
  },
  {
    id: 6,
    name: "2x2 ID Photo",
    description: "Recent 2x2 ID photo with white background.",
    status: "approved",
    progress: 100,
    dueDate: "2026-03-10",
    helpTip: "Must be taken within the last 6 months. White background, formal attire.",
    uploadedFile: "id_photo.jpg",
    group: "personal",
  },
  {
    id: 7,
    name: "Birth Certificate (PSA)",
    description: "PSA-issued birth certificate. Photocopy is acceptable.",
    status: "approved",
    progress: 100,
    dueDate: "2026-03-10",
    helpTip: "Must be PSA-issued (not local civil registrar). Order online at PSA Serbilis if needed.",
    uploadedFile: "birth_cert_psa.pdf",
    group: "personal",
  },
  {
    id: 8,
    name: "Parent/Guardian Consent",
    description: "Signed consent form from parent or legal guardian.",
    status: "missing",
    progress: 0,
    dueDate: "2026-03-30",
    helpTip: "Download the consent form template, have it signed and notarized.",
    sampleUrl: "#",
    group: "personal",
  },
];

const statusConfig: Record<RequirementStatus, { label: string; variant: "success" | "warning" | "info" | "error"; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  pending: { label: "Pending Review", variant: "warning", icon: Clock },
  "in-progress": { label: "In Progress", variant: "info", icon: TrendingUp },
  missing: { label: "Missing", variant: "error", icon: AlertCircle },
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
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ======================== REQUIREMENTS PAGE ======================== */

export default function RequirementsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    personal: true,
    academic: true,
    financial: true,
  });
  const [uploadModal, setUploadModal] = useState<{ open: boolean; name?: string }>({ open: false });
  const [checkedItems, setCheckedItems] = useState<Set<number>>(
    new Set(requirements.filter((r) => r.status === "approved").map((r) => r.id))
  );

  /* Filtered requirements */
  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter;
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  /* Grouped */
  const grouped = useMemo(() => {
    const groups: Record<string, Requirement[]> = { personal: [], academic: [], financial: [] };
    filtered.forEach((r) => groups[r.group].push(r));
    return groups;
  }, [filtered]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const overallProgress = Math.round(
    requirements.reduce((sum, r) => sum + r.progress, 0) / requirements.length
  );

  const filterCounts: Record<FilterType, number> = {
    all: requirements.length,
    approved: requirements.filter((r) => r.status === "approved").length,
    pending: requirements.filter((r) => r.status === "pending").length,
    "in-progress": requirements.filter((r) => r.status === "in-progress").length,
    missing: requirements.filter((r) => r.status === "missing").length,
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
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
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Requirements Tracker</h1>
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
              color={overallProgress >= 80 ? "sage" : overallProgress >= 50 ? "ocean" : "amber"}
            />
            <p className="mt-2 text-xs font-body text-muted-fg">
              {filterCounts.approved} of {filterCounts.all} requirements completed
            </p>
          </Card>
        </motion.div>

        {/* Search + Filters */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
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
            {(["all", "approved", "pending", "in-progress", "missing"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap
                  transition-all duration-200
                  ${filter === f
                    ? "bg-ocean-400 text-white shadow-soft"
                    : "bg-muted text-muted-fg hover:bg-card-border hover:text-foreground"
                  }
                `}
                aria-pressed={filter === f}
              >
                {f === "all" ? "All" : statusConfig[f].label} ({filterCounts[f]})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Requirements Groups */}
        {(Object.entries(grouped) as [string, Requirement[]][]).map(([group, items]) => {
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
                <Badge variant="neutral" className="ml-1">{items.length}</Badge>
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
                        onUpload={() => setUploadModal({ open: true, name: req.name })}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

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
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
            <Button variant="secondary" onClick={() => { setFilter("all"); setSearchQuery(""); }}>
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
  const config = statusConfig[req.status];
  const StatusIcon = config.icon;
  const dueDate = new Date(req.dueDate);
  const isOverdue = dueDate < new Date() && req.status !== "approved";
  const daysDiff = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card padding="none" hover className="overflow-hidden">
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
                <h3 className={`font-body font-medium text-sm ${isChecked ? 'line-through text-muted-fg' : 'text-foreground'}`}>
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

            {/* Progress */}
            <div className="mt-3">
              <ProgressBar
                value={req.progress}
                size="sm"
                showValue
                color={req.status === "approved" ? "sage" : req.status === "missing" ? "coral" : "ocean"}
              />
            </div>

            {/* Due date + actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-fg" />
                <span className={`text-xs font-body ${isOverdue ? 'text-coral-400 font-medium' : 'text-muted-fg'}`}>
                  {isOverdue ? "Overdue! " : ""}
                  Due {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {!isOverdue && daysDiff <= 7 && daysDiff > 0 && (
                    <span className="text-amber-500 ml-1">({daysDiff} days left)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {req.sampleUrl && (
                  <button
                    className="text-xs font-body text-ocean-400 hover:text-ocean-500 flex items-center gap-1 transition-colors"
                  >
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
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {req.status !== "approved" && (
                  <Button size="sm" variant="secondary" onClick={onUpload} leftIcon={<Upload className="w-3.5 h-3.5" />}>
                    Upload
                  </Button>
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
              <p className="font-body text-sm text-muted-fg">{req.description}</p>

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
                  <strong className="text-foreground">Tip:</strong> {req.helpTip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
