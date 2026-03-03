/* ================================================================
   ADMIN — VALIDATORS LIST
   View and create validator / staff accounts
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  RefreshCw,
  Mail,
  Plus,
  ClipboardCheck,
  X,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

interface Validator {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
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
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

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
        }),
      });

      if (res.ok) {
        setCreateSuccess("Validator account created successfully!");
        setNewEmail("");
        setNewName("");
        setNewPassword("");
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
            {validators.length !== 1 ? "s" : ""}
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

      {/* Create Form */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Button type="submit" isLoading={creating} size="sm">
                Create Validator
              </Button>
            </form>
          </Card>
        </motion.div>
      )}

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
              <Card key={v.id} padding="md" hover>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-sage-50 dark:bg-sage-400/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-sage-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    </div>
                  </div>

                  {/* Joined date */}
                  <div className="text-xs font-body text-muted-fg flex-shrink-0">
                    Joined {new Date(v.created_at).toLocaleDateString()}
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
