/* ================================================================
   ADMIN — REGISTERED APPLICANTS
   List all registered applicant accounts with barangay info
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  MapPin,
  Mail,
  RefreshCw,
  Filter,
  Calendar,
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

interface RegisteredApplicant {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  address: string | null;
  created_at: string;
}

function extractBarangay(address: string | null): string {
  if (!address) return "Unknown";
  const parts = address.split(",").map((p) => p.trim());
  const marivIdx = parts.findIndex((p) =>
    p.toLowerCase().includes("mariveles"),
  );
  if (marivIdx > 0) return parts[marivIdx - 1];
  return parts[0] || "Unknown";
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export default function RegisteredApplicantsPage() {
  const [applicants, setApplicants] = useState<RegisteredApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");

  const load = useCallback(async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterBarangay) params.set("barangay", filterBarangay);

      const res = await fetch(`/api/admin/registered?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const { data } = await res.json();
        setApplicants(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterBarangay]);

  useEffect(() => {
    load();
  }, [load]);

  // Group by barangay for summary
  const barangayCounts: Record<string, number> = {};
  for (const a of applicants) {
    const brgy = extractBarangay(a.address);
    barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-ocean-400" />
            Registered Applicants
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            {applicants.length} registered account
            {applicants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-card-bg border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 focus:border-ocean-400 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <select
            value={filterBarangay}
            onChange={(e) => setFilterBarangay(e.target.value)}
            className="bg-card-bg border border-card-border rounded-xl pl-10 pr-8 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 focus:border-ocean-400 transition-all appearance-none"
          >
            <option value="">All Barangays</option>
            {MARIVELES_BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barangay summary chips */}
      {!filterBarangay && Object.keys(barangayCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(barangayCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([brgy, count]) => (
              <button
                key={brgy}
                onClick={() => setFilterBarangay(brgy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ocean-50 dark:bg-ocean-400/10 text-ocean-500 dark:text-ocean-400 text-xs font-body font-medium hover:bg-ocean-100 dark:hover:bg-ocean-400/20 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {brgy}
                <span className="font-bold">{count}</span>
              </button>
            ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
          <p className="font-body text-muted-fg">
            No registered applicants found
          </p>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {applicants.map((a) => (
            <motion.div key={a.user_id} variants={fadeUp}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-heading font-bold text-sm">
                    {a.full_name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-foreground truncate">
                    {a.full_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-fg font-body">
                      <Mail className="w-3 h-3" />
                      {a.email}
                    </span>
                    {a.address && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-fg font-body">
                        <MapPin className="w-3 h-3" />
                        {extractBarangay(a.address)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-fg font-body">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <Badge variant={a.is_active ? "success" : "neutral"}>
                  {a.is_active ? "Active" : "Inactive"}
                </Badge>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
