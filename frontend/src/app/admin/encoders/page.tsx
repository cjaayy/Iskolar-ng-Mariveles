"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Mail,
  Plus,
  X,
  AlertTriangle,
  School,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

const ALL_SCHOOLS = [
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
  "Sunny Hillside School of Bataan, Inc.",
  "Saint Nicholas Catholic School of Mariveles",
  "Santa Mariana De Jesus Academy, Inc.",
  "Bataan GN Christian School, Inc.",
  "Christian Community School of Mariveles, Inc.",
  "Softnet Information Technology Center",
  "Blessed Regina Protmann Catholic School",
  "BEPZ Multinational School, Inc.",
];

interface Encoder {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  assigned_school: string | null;
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

export default function AdminEncodersPage() {
  const [encoders, setEncoders] = useState<Encoder[]>([]);
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

  const takenSchools = encoders
    .filter((v) => v.is_active && v.assigned_school)
    .map((v) => v.assigned_school!);

  const availableSchools = ALL_SCHOOLS.filter((s) => !takenSchools.includes(s));

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/encoders?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setEncoders(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch encoders:", e);
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
      const res = await fetch("/api/admin/encoders", {
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
        setCreateSuccess("Encoder account created successfully!");
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
        setCreateError(err.error || "Failed to create encoder");
      }
    } catch {
      setCreateError("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (v: Encoder) => {
    if (!adminId) return;
    setActionLoading(v.id);
    setActionError("");

    try {
      const res = await fetch("/api/admin/encoders", {
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
      const res = await fetch(`/api/admin/encoders?id=${id}`, {
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

  const handleAssignSchool = async (encoderId: number, school: string) => {
    if (!adminId) return;
    setActionLoading(encoderId);
    setActionError("");

    try {
      const res = await fetch("/api/admin/encoders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({
          id: encoderId,
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
            Encoders
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            {encoders.length} encoder{encoders.length !== 1 ? "s" : ""} &middot;{" "}
            {encoders.filter((v) => v.is_active).length} active
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-fg absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full sm:w-60 bg-muted border-0 rounded-xl pl-9 pr-3 py-2 text-xs font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
            />
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
            {showCreate ? "Cancel" : "Add Encoder"}
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
                Create New Encoder Account
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
                      placeholder="e.g. encoder@iskolar.local"
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
                      placeholder="Set a temporary password"
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
                      <option value="">Select a school</option>
                      {availableSchools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {createError && (
                  <p className="text-sm text-coral-500 font-body">
                    {createError}
                  </p>
                )}
                {createSuccess && (
                  <p className="text-sm text-sage-500 font-body">
                    {createSuccess}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={creating}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Encoder
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        ) : encoders.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <School className="w-12 h-12 text-muted-fg mx-auto mb-3 opacity-30" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No Encoders Found
              </h3>
              <p className="font-body text-sm text-muted-fg">
                Create an encoder account to manage student registrations.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {encoders.map((e) => (
              <Card key={e.id} padding="md" hover>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">
                        {e.full_name}
                      </h3>
                      <Badge variant={e.is_active ? "success" : "error"} dot>
                        {e.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {e.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5" />
                        {e.assigned_school || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={e.assigned_school || ""}
                      onChange={(evt) =>
                        handleAssignSchool(e.id, evt.target.value)
                      }
                      className="bg-muted border-0 rounded-lg px-3 py-2 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                    >
                      <option value="">Select school</option>
                      {ALL_SCHOOLS.map((school) => (
                        <option
                          key={school}
                          value={school}
                          disabled={
                            school !== e.assigned_school &&
                            encoders.some(
                              (v) =>
                                v.is_active && v.assigned_school === school,
                            )
                          }
                        >
                          {school}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(e)}
                      isLoading={actionLoading === e.id}
                      leftIcon={
                        e.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )
                      }
                    >
                      {e.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    {confirmDelete === e.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(e.id)}
                          isLoading={actionLoading === e.id}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="bg-coral-400 hover:bg-coral-500 text-white"
                        >
                          Confirm Delete
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(e.id)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
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
