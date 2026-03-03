/* ================================================================
   ADMIN — APPLICANTS LIST
   View all applicants with search and basic info
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  GraduationCap,
  RefreshCw,
  Mail,
  Phone,
  BookOpen,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

interface Applicant {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  student_number: string;
  gpa: number;
  year_level: number;
  course: string;
  college: string;
  monthly_income: number;
  contact_number: string | null;
  created_at: string;
  total_applications: number;
  approved_applications: number;
}

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"];
function toOrdinal(n: number) {
  return (ORDINALS[n] ?? `${n}th`) + " Year";
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

export default function AdminApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  const fetchData = useCallback(async () => {
    if (!adminId) return;
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/applicants?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const json = await res.json();
        setApplicants(json.data);
        setTotal(json.meta.total);
      }
    } catch (e) {
      console.error("Failed to fetch applicants:", e);
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
            Applicants
          </h1>
          <p className="font-body text-muted-fg text-sm mt-0.5">
            {total} registered applicant{total !== 1 ? "s" : ""}
          </p>
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
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or student number..."
              className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
            />
          </div>
        </Card>
      </motion.div>

      {/* Applicants List */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : applicants.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-fg mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No Applicants Found
              </h3>
              <p className="font-body text-muted-fg text-sm">
                {search
                  ? "Try a different search term."
                  : "No applicants have registered yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {applicants.map((a) => (
              <Card key={a.user_id} padding="md" hover>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-ocean-50 dark:bg-ocean-400/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-ocean-400 font-heading font-bold text-lg">
                      {a.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">
                        {a.full_name}
                      </h3>
                      <Badge variant={a.is_active ? "success" : "error"} dot>
                        {a.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {a.student_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {a.email}
                      </span>
                      {a.contact_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {a.contact_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {a.course} · {toOrdinal(a.year_level)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-heading font-bold text-foreground">
                        {a.total_applications}
                      </p>
                      <p className="text-[10px] font-body text-muted-fg">
                        Applications
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-heading font-bold text-sage-500">
                        {a.approved_applications}
                      </p>
                      <p className="text-[10px] font-body text-muted-fg">
                        Approved
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-heading font-bold text-ocean-400">
                        {Number(a.gpa).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-body text-muted-fg">GPA</p>
                    </div>
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
