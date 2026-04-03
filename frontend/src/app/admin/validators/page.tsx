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
  GraduationCap,
  AlertTriangle,
  School,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

// Schools list - same as in registration form
const ALL_SCHOOLS = [
  // Public Elementary Schools
  "A.G. Llamas Elementary School",
  "Alasasin Elementary School",
  "Balon Elementary School",
  "Baseco Elementary School",
  "Batangas II Elementary School",
  "Bayview Elementary School",
  "Bepz Elementary School",
  "Biaan Aeta School",
  "Cabcaben Elementary School",
  "Gonzales Elementary School",
  "Ipag Elementary School",
  "Lucanin Elementary School",
  "Marina Bay Elementary School",
  "Mountain View Elementary School",
  "New Alion Elementary School",
  "Old Alion Elementary School",
  "Renato L. Cayetano Memorial School",
  "San Isidro Primary School",
  "Sisiman Elementary School",
  "Sto. Niño Biaan Elementary School",
  "Townsite Elementary School",
  // Public Junior & Senior High Schools
  "MNHS - Poblacion",
  "MNHS - Alasasin",
  "MNHS - Alion",
  "MNHS - Baseco",
  "MNHS - Batangas II",
  "MNHS - Cabcaben",
  "MNHS - Malaya",
  "MNHS - Camaya Campus",
  "Mariveles Senior High School - Sitio Mabuhay",
  "Ipag National High School",
  "Lamao National High School",
  "Biaan Integrated School",
  // Private Schools
  "Sunny Hillside School of Bataan, Inc.",
  "Saint Nicholas Catholic School of Mariveles",
  "Santa Mariana De Jesus Academy, Inc.",
  "Bataan GN Christian School, Inc.",
  "Christian Community School of Mariveles, Inc.",
  "Softnet Information Technology Center",
  "Blessed Regina Protmann Catholic School",
  "BEPZ Multinational School, Inc.",
];

interface Validator {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  assigned_school: string | null;
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

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const takenSchools = validators
    .filter((v) => v.is_active && v.assigned_school)
    .map((v) => v.assigned_school!);

  const availableSchools = ALL_SCHOOLS.filter(
    (s) => !takenSchools.includes(s)
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
          assignedSchool: newSchool,
        }),
      });

      if (res.ok) {
        setCreateSuccess("Validator account created successfully!");
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setNewSchool("");
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

  const handleAssignSchool = async (
    validatorId: number,
    school: string,
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
          action: "assign_school",
          assignedSchool: school,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || "Failed to assign school");
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
                      Assigned School
                    </label>
                    <select
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      required
                      className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    >
                      <option value="">Select a school...</option>
                      {availableSchools.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {availableSchools.length === 0 && (
                      <p className="text-xs text-coral-400 mt-1 font-body">
                        All schools have active validators assigned
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
                  disabled={!newSchool}
                >
                  Create Validator
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                          <GraduationCap className="w-3.5 h-3.5" />
                          {v.assigned_school || (
                            <span className="italic text-coral-400">
                              No school
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={v.assigned_school || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignSchool(v.id, e.target.value);
                          }
                        }}
                        disabled={actionLoading === v.id}
                        className="bg-muted border-0 rounded-lg px-2 py-1.5 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 max-w-[200px]"
                        title="Assign school"
                      >
                        <option value="">
                          {v.assigned_school
                            ? v.assigned_school
                            : "Assign school..."}
                        </option>
                        {ALL_SCHOOLS.filter(
                          (s) =>
                            s === v.assigned_school ||
                            !takenSchools.includes(s) ||
                            !validators.find(
                              (vx) =>
                                vx.id !== v.id &&
                                vx.assigned_school === s &&
                                vx.is_active,
                            ),
                        ).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

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

                  <div className="flex items-center justify-between border-t border-card-border pt-2">
                    <span className="text-xs font-body text-muted-fg">
                      Joined {new Date(v.created_at).toLocaleDateString()}
                    </span>
                    {v.assigned_school && (
                      <Badge variant="info">
                        <School className="w-3 h-3 mr-1 inline" />
                        {v.assigned_school}
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
