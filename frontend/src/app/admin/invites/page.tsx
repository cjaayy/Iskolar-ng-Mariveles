"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LinkIcon,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  X,
  ExternalLink,
  Calendar,
  Hash,
  Filter,
  Edit3,
  Users,
  GraduationCap,
  School,
  BookOpen,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

type EducationLevel = "elementary" | "high_school" | "senior_high";

interface InviteLink {
  id: number;
  token: string;
  label: string | null;
  education_level: EducationLevel;
  description: string | null;
  max_uses: number;
  times_used: number;
  expires_at: string | null;
  created_by: number;
  creator_name: string;
  is_active: boolean;
  created_at: string;
}

const EDUCATION_LEVELS: {
  value: EducationLevel;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "elementary",
    label: "Elementary",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-500/20",
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  {
    value: "high_school",
    label: "High School",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/20",
    icon: <School className="w-3.5 h-3.5" />,
  },
  {
    value: "senior_high",
    label: "Senior High",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-500/20",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
  },
];

const getEducationLevelConfig = (level: EducationLevel) => {
  return EDUCATION_LEVELS.find((l) => l.value === level) || EDUCATION_LEVELS[2];
};

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

export default function AdminInvitesPage() {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<EducationLevel | "all">("all");

  // Create form state
  const [label, setLabel] = useState("");
  const [educationLevel, setEducationLevel] =
    useState<EducationLevel>("senior_high");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal state
  const [editingLink, setEditingLink] = useState<InviteLink | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEducationLevel, setEditEducationLevel] =
    useState<EducationLevel>("senior_high");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxUses, setEditMaxUses] = useState("0");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const url =
        filterLevel === "all"
          ? "/api/admin/invites"
          : `/api/admin/invites?educationLevel=${filterLevel}`;
      const res = await fetch(url, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setLinks(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch invites:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, filterLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getRegistrationUrl = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/register/${token}`;
  };

  const copyToClipboard = async (link: InviteLink) => {
    try {
      await navigator.clipboard.writeText(getRegistrationUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = getRegistrationUrl(link.token);
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;
    if (!label.trim()) {
      setCreateError("Link name is required");
      return;
    }
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          label: label.trim(),
          educationLevel,
          description: description.trim() || undefined,
          maxUses: Number(maxUses) || 0,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (res.ok) {
        setLabel("");
        setEducationLevel("senior_high");
        setDescription("");
        setMaxUses("0");
        setExpiresAt("");
        setShowCreate(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setCreateError(err.error || "Failed to create link");
      }
    } catch {
      setCreateError("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (link: InviteLink) => {
    setEditingLink(link);
    setEditLabel(link.label || "");
    setEditEducationLevel(link.education_level);
    setEditDescription(link.description || "");
    setEditMaxUses(String(link.max_uses));
    setEditExpiresAt(link.expires_at ? link.expires_at.slice(0, 16) : "");
    setEditIsActive(link.is_active);
    setUpdateError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId || !editingLink) return;
    setUpdating(true);
    setUpdateError("");

    try {
      const res = await fetch(`/api/admin/invites/${editingLink.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          label: editLabel.trim() || null,
          educationLevel: editEducationLevel,
          description: editDescription.trim() || null,
          maxUses: Number(editMaxUses) || 0,
          expiresAt: editExpiresAt || null,
          isActive: editIsActive,
        }),
      });

      if (res.ok) {
        setEditingLink(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setUpdateError(err.error || "Failed to update link");
      }
    } catch {
      setUpdateError("An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const deleteLink = async (link: InviteLink) => {
    if (!adminId) return;
    if (!confirm("Are you sure you want to delete this registration link?"))
      return;
    try {
      await fetch(`/api/admin/invites/${link.id}`, {
        method: "DELETE",
        headers: { "x-admin-id": adminId },
      });
      fetchData();
    } catch {
      console.error("Failed to delete link");
    }
  };

  const isExpired = (link: InviteLink) =>
    link.expires_at && new Date(link.expires_at) < new Date();

  const isUsedUp = (link: InviteLink) =>
    link.max_uses > 0 && link.times_used >= link.max_uses;

  const getLinkStatus = (link: InviteLink) => {
    if (!link.is_active)
      return { label: "Disabled", variant: "neutral" as const };
    if (isExpired(link)) return { label: "Expired", variant: "error" as const };
    if (isUsedUp(link))
      return { label: "Used Up", variant: "warning" as const };
    return { label: "Active", variant: "success" as const };
  };

  // Analytics summary
  const analytics = {
    total: links.length,
    elementary: links.filter((l) => l.education_level === "elementary").length,
    highSchool: links.filter((l) => l.education_level === "high_school").length,
    seniorHigh: links.filter((l) => l.education_level === "senior_high").length,
    totalApplicants: links.reduce((sum, l) => sum + l.times_used, 0),
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Registration Links
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            Create shareable links for applicants to pre-register their accounts
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            leftIcon={
              showCreate ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )
            }
          >
            {showCreate ? "Cancel" : "Create New Link"}
          </Button>
        </div>
      </motion.div>

      {/* Analytics Cards */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {analytics.total}
          </p>
          <p className="text-xs text-muted-fg">Total Links</p>
        </Card>
        <Card
          padding="sm"
          className="text-center border-emerald-200 dark:border-emerald-800"
        >
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.elementary}
          </p>
          <p className="text-xs text-muted-fg">Elementary</p>
        </Card>
        <Card
          padding="sm"
          className="text-center border-blue-200 dark:border-blue-800"
        >
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.highSchool}
          </p>
          <p className="text-xs text-muted-fg">High School</p>
        </Card>
        <Card
          padding="sm"
          className="text-center border-purple-200 dark:border-purple-800"
        >
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.seniorHigh}
          </p>
          <p className="text-xs text-muted-fg">Senior High</p>
        </Card>
        <Card padding="sm" className="text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-foreground">
            {analytics.totalApplicants}
          </p>
          <p className="text-xs text-muted-fg flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Registrations
          </p>
        </Card>
      </motion.div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card padding="md">
              <h3 className="font-heading font-semibold text-foreground mb-4">
                Create New Registration Link
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Link Name <span className="text-coral-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder='e.g. "Batch 2026 Elementary Applicants"'
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Education Level <span className="text-coral-400">*</span>
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) =>
                        setEducationLevel(e.target.value as EducationLevel)
                      }
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    >
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-body text-muted-fg mb-1">
                    Description{" "}
                    <span className="text-muted-fg/60">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes or instructions for this registration link..."
                    rows={2}
                    className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Max Uses{" "}
                      <span className="text-muted-fg/60">(0 = unlimited)</span>
                    </label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      min="0"
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Expiration Date{" "}
                      <span className="text-muted-fg/60">(optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>
                </div>
                {createError && (
                  <p className="text-sm text-coral-400 font-body">
                    {createError}
                  </p>
                )}
                <Button type="submit" isLoading={creating} size="sm">
                  Generate Link
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-2 flex-wrap"
      >
        <div className="flex items-center gap-1.5 text-sm text-muted-fg">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>
        <button
          onClick={() => setFilterLevel("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterLevel === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-fg hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {EDUCATION_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setFilterLevel(level.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterLevel === level.value
                ? `${level.bgColor} ${level.color}`
                : "bg-muted text-muted-fg hover:bg-muted/80"
            }`}
          >
            {level.icon}
            {level.label}
          </button>
        ))}
      </motion.div>

      {/* Links Table */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </Card>
            ))}
          </div>
        ) : links.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <LinkIcon className="w-12 h-12 text-muted-fg mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                {filterLevel === "all"
                  ? "No Registration Links"
                  : `No ${getEducationLevelConfig(filterLevel as EducationLevel).label} Links`}
              </h3>
              <p className="font-body text-muted-fg text-sm mb-4">
                {filterLevel === "all"
                  ? "Create a link to allow applicants to register their accounts."
                  : "No registration links found for this education level."}
              </p>
              {filterLevel === "all" && (
                <Button
                  size="sm"
                  onClick={() => setShowCreate(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Link
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-fg uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-fg uppercase tracking-wider">
                    Level
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-fg uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-fg uppercase tracking-wider">
                    Analytics
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-fg uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {links.map((link) => {
                  const status = getLinkStatus(link);
                  const levelConfig = getEducationLevelConfig(
                    link.education_level,
                  );
                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-ocean-400 flex-shrink-0" />
                            <span className="font-medium text-foreground">
                              {link.label || "Untitled Link"}
                            </span>
                          </div>
                          {link.description && (
                            <p className="text-xs text-muted-fg line-clamp-1 ml-6">
                              {link.description}
                            </p>
                          )}
                          <div className="ml-6 flex items-center gap-2 text-xs text-muted-fg">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Created{" "}
                              {new Date(link.created_at).toLocaleDateString()}
                            </span>
                            {link.expires_at && (
                              <>
                                <span>•</span>
                                <span
                                  className={
                                    isExpired(link) ? "text-coral-400" : ""
                                  }
                                >
                                  {isExpired(link)
                                    ? "Expired"
                                    : `Expires ${new Date(link.expires_at).toLocaleDateString()}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${levelConfig.bgColor} ${levelConfig.color}`}
                        >
                          {levelConfig.icon}
                          {levelConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={status.variant} dot>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="w-4 h-4 text-muted-fg" />
                          <span className="font-semibold text-foreground">
                            {link.times_used}
                          </span>
                          <span className="text-muted-fg">
                            / {link.max_uses === 0 ? "∞" : link.max_uses}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyToClipboard(link)}
                            className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-all"
                            title="Copy link"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-4 h-4 text-sage-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              window.open(
                                getRegistrationUrl(link.token),
                                "_blank",
                              )
                            }
                            className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-all"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(link)}
                            className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-all"
                            title="Edit link"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLink(link)}
                            className="p-2 rounded-lg text-muted-fg hover:bg-coral-50 dark:hover:bg-coral-500/10 hover:text-coral-500 transition-all"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingLink(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    Edit Registration Link
                  </h3>
                  <button
                    onClick={() => setEditingLink(null)}
                    className="p-2 rounded-lg text-muted-fg hover:bg-muted transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Link Name
                    </label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Enter link name"
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Education Level
                    </label>
                    <select
                      value={editEducationLevel}
                      onChange={(e) =>
                        setEditEducationLevel(e.target.value as EducationLevel)
                      }
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    >
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add notes or instructions..."
                      rows={2}
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Max Uses (0 = unlimited)
                      </label>
                      <input
                        type="number"
                        value={editMaxUses}
                        onChange={(e) => setEditMaxUses(e.target.value)}
                        min="0"
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="datetime-local"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-body text-foreground">
                      Link Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editIsActive ? "bg-sage-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editIsActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-fg -mt-2">
                    {editIsActive
                      ? "Link is active and can be used"
                      : "Link is disabled and cannot be used"}
                  </p>

                  {updateError && (
                    <p className="text-sm text-coral-400 font-body">
                      {updateError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingLink(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={updating}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
