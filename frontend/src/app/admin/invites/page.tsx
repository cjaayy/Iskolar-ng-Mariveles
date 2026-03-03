/* ================================================================
   ADMIN — REGISTRATION LINKS (Invite links for pre-registration)
   Create, view, copy, toggle, and delete registration links
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LinkIcon,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  ExternalLink,
  Calendar,
  Hash,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

interface InviteLink {
  id: number;
  token: string;
  label: string | null;
  max_uses: number;
  times_used: number;
  expires_at: string | null;
  created_by: number;
  creator_name: string;
  is_active: boolean;
  created_at: string;
}

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

  // Create form
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const res = await fetch("/api/admin/invites", {
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
  }, [adminId]);

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
      // Fallback
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
          label: label || undefined,
          maxUses: Number(maxUses) || 0,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (res.ok) {
        setLabel("");
        setMaxUses("1");
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

  const toggleActive = async (link: InviteLink) => {
    if (!adminId) return;
    try {
      await fetch(`/api/admin/invites/${link.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({ isActive: !link.is_active }),
      });
      fetchData();
    } catch {
      console.error("Failed to toggle link");
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
            {showCreate ? "Cancel" : "Create Link"}
          </Button>
        </div>
      </motion.div>

      {/* Create Form */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-body text-muted-fg mb-1">
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder='e.g. "Batch 2026 Applicants"'
                    className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-muted-fg mb-1">
                    Max Uses (0 = unlimited)
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
                    Expires At (optional)
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

      {/* Links List */}
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
                No Registration Links
              </h3>
              <p className="font-body text-muted-fg text-sm mb-4">
                Create a link to allow applicants to register their accounts.
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Link
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const status = getLinkStatus(link);
              return (
                <Card key={link.id} padding="md">
                  <div className="flex flex-col gap-3">
                    {/* Top row: label + status + actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-ocean-400 flex-shrink-0" />
                        <h3 className="font-heading font-semibold text-foreground truncate">
                          {link.label || "Untitled Link"}
                        </h3>
                        <Badge variant={status.variant} dot>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
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
                          onClick={() => toggleActive(link)}
                          className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-all"
                          title={
                            link.is_active ? "Disable link" : "Enable link"
                          }
                        >
                          {link.is_active ? (
                            <ToggleRight className="w-4 h-4 text-sage-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteLink(link)}
                          className="p-2 rounded-lg text-muted-fg hover:bg-coral-50 dark:hover:bg-coral-500/10 hover:text-coral-500 transition-all"
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* URL */}
                    <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono text-muted-fg break-all select-all">
                      {getRegistrationUrl(link.token)}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {link.times_used} /{" "}
                        {link.max_uses === 0 ? "∞" : link.max_uses} uses
                      </span>
                      {link.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Expires: {new Date(link.expires_at).toLocaleString()}
                        </span>
                      )}
                      <span>
                        Created {new Date(link.created_at).toLocaleDateString()}{" "}
                        by {link.creator_name}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
