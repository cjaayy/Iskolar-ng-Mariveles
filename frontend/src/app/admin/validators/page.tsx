/* ================================================================
   ADMIN — VALIDATORS LIST
   View, create, delete, deactivate and assign barangay to validators
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldCheck,
  RefreshCw,
  Mail,
  Plus,
  ClipboardCheck,
  X,
  Trash2,
  Power,
  PowerOff,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

const MARIVELES_BARANGAYS = [
  "Alas-asin",
  "Alion",
  "Balon-Anito",
  "Baseco Country (Bataan Shipyard)",
  "Batangas II",
  "Biaan",
  "Cabcaben",
  "Camaya",
  "Casili (Cataning)",
  "Ipag",
  "Lucanin",
  "Malaya",
  "Maligaya",
  "Mt. View",
  "Poblacion",
  "San Carlos",
  "San Isidro",
  "Sisiman",
  "Townsite",
];

interface Validator {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  assigned_barangay: string | null;
  created_at: string;
  total_validations: number;
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

export default function AdminValidatorsPage() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBarangay, setNewBarangay] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  /* ─── Available barangays (not yet assigned to an active validator) ─── */
  const takenBarangays = validators
    .filter((v) => v.is_active && v.assigned_barangay)
    .map((v) => v.assigned_barangay!);

  const availableBarangays = MARIVELES_BARANGAYS.filter(
    (b) => !takenBarangays.includes(b),
  );

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/validators?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setValidators(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch validators:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminId, search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  /* ─── Create ─── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/admin/validators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName,
          password: newPassword,
          assignedBarangay: newBarangay,
        }),
      });

      if (res.ok) {
        setCreateSuccess("Validator account created successfully!");
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setNewBarangay("");
        fetchData();
        setTimeout(() => {
          setShowCreate(false);
          setCreateSuccess("");
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setCreateError(err.error || "Failed to create validator");
      }
    } catch {
      setCreateError("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  /* ─── Toggle Active / Deactivate ─── */
  const handleToggleActive = async (v: Validator) => {
    if (!adminId) return;
    setActionLoading(v.id);
    setActionError("");

    try {
      const res = await fetch("/api/admin/validators", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          id: v.id,
          action: v.is_active ? "deactivate" : "activate",
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Failed to update");
      }
    } catch {
      setActionError("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id: number) => {
    if (!adminId) return;
    setActionLoading(id);
    setActionError("");

    try {
      const res = await fetch(`/api/admin/validators?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-id": adminId },
      });

      if (res.ok) {
        setConfirmDelete(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Failed to delete");
      }
    } catch {
      setActionError("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Assign Barangay ─── */
  const handleAssignBarangay = async (
    validatorId: number,
    barangay: string,
  ) => {
    if (!adminId) return;
    setActionLoading(validatorId);
    setActionError("");

    try {
      const res = await fetch("/api/admin/validators", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          id: validatorId,
          action: "assign_barangay",
          assignedBarangay: barangay,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Failed to assign barangay");
      }
    } catch {
      setActionError("An error occurred");
    } finally {
      setActionLoading(null);
    }
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
            Validators
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            {validators.length} staff validator
            {validators.length !== 1 ? "s" : ""} &middot;{" "}
            {validators.filter((v) => v.is_active).length} active
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
            {showCreate ? "Cancel" : "Add Validator"}
          </Button>
        </div>
      </motion.div>

      {/* Action error toast */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-coral-600 dark:text-coral-400 font-body"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {actionError}
            <button
              onClick={() => setActionError("")}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                Create New Validator Account
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="e.g. Maria Santos"
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      placeholder="e.g. maria@iskolar.local"
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-muted-fg mb-1">
                      Assigned Barangay
                    </label>
                    <select
                      value={newBarangay}
                      onChange={(e) => setNewBarangay(e.target.value)}
                      required
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    >
                      <option value="">Select a barangay...</option>
                      {availableBarangays.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {availableBarangays.length === 0 && (
                      <p className="text-xs text-coral-400 mt-1 font-body">
                        All barangays have active validators assigned
                      </p>
                    )}
                  </div>
                </div>
                {createError && (
                  <p className="text-sm text-coral-400 font-body">
                    {createError}
                  </p>
                )}
                {createSuccess && (
                  <p className="text-sm text-sage-500 font-body">
                    {createSuccess}
                  </p>
                )}
                <Button
                  type="submit"
                  isLoading={creating}
                  size="sm"
                  disabled={!newBarangay}
                >
                  Create Validator
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
            />
          </div>
        </Card>
      </motion.div>

      {/* Validators List */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : validators.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 text-muted-fg mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No Validators Found
              </h3>
              <p className="font-body text-muted-fg text-sm">
                {search
                  ? "Try a different search term."
                  : "No validator accounts have been created yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {validators.map((v) => (
              <Card
                key={v.id}
                padding="md"
                hover
                className={!v.is_active ? "opacity-60" : undefined}
              >
                <div className="flex flex-col gap-4">
                  {/* Top row: avatar + info + actions */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        v.is_active
                          ? "bg-sage-50 dark:bg-sage-400/10"
                          : "bg-neutral-100 dark:bg-neutral-700/20"
                      }`}
                    >
                      <ShieldCheck
                        className={`w-6 h-6 ${
                          v.is_active ? "text-sage-500" : "text-muted-fg"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-heading font-semibold text-foreground truncate">
                          {v.full_name}
                        </h3>
                        <Badge variant={v.is_active ? "success" : "error"} dot>
                          {v.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {v.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          {v.total_validations} validation
                          {v.total_validations !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {v.assigned_barangay || (
                            <span className="italic text-coral-400">
                              No barangay
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Assign / Change Barangay */}
                      <select
                        value={v.assigned_barangay || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignBarangay(v.id, e.target.value);
                          }
                        }}
                        disabled={actionLoading === v.id}
                        className="bg-muted border-0 rounded-lg px-2 py-1.5 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 max-w-[160px]"
                        title="Assign barangay"
                      >
                        <option value="">
                          {v.assigned_barangay
                            ? v.assigned_barangay
                            : "Assign barangay..."}
                        </option>
                        {MARIVELES_BARANGAYS.filter(
                          (b) =>
                            b === v.assigned_barangay ||
                            !takenBarangays.includes(b) ||
                            !validators.find(
                              (vx) =>
                                vx.id !== v.id &&
                                vx.assigned_barangay === b &&
                                vx.is_active,
                            ),
                        ).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(v)}
                        disabled={actionLoading === v.id}
                        title={
                          v.is_active
                            ? "Deactivate validator"
                            : "Activate validator"
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          v.is_active
                            ? "hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500"
                            : "hover:bg-sage-50 dark:hover:bg-sage-400/10 text-sage-500"
                        }`}
                      >
                        {actionLoading === v.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : v.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete */}
                      {confirmDelete === v.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={actionLoading === v.id}
                            className="px-2 py-1 rounded-lg bg-coral-500 text-white text-xs font-body hover:bg-coral-600 transition-colors"
                          >
                            {actionLoading === v.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 rounded-lg bg-muted text-muted-fg text-xs font-body hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(v.id)}
                          disabled={actionLoading === v.id}
                          title="Delete validator"
                          className="p-2 rounded-lg hover:bg-coral-50 dark:hover:bg-coral-500/10 text-coral-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer: joined date */}
                  <div className="flex items-center justify-between border-t border-card-border pt-2">
                    <span className="text-xs font-body text-muted-fg">
                      Joined {new Date(v.created_at).toLocaleDateString()}
                    </span>
                    {v.assigned_barangay && (
                      <Badge variant="info">
                        <MapPin className="w-3 h-3 mr-1 inline" />
                        {v.assigned_barangay}
                      </Badge>
                    )}
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
