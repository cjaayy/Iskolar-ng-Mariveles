/* ================================================================
   ADMIN DASHBOARD
   Overview with stats cards
   ================================================================ */

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Users, ShieldCheck, LinkIcon, FileText } from "lucide-react";
import { Card } from "@/components/ui";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

interface Stats {
  totalApplicants: number;
  totalValidators: number;
  totalLinks: number;
  activeLinks: number;
  totalApplications: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;

    async function load() {
      try {
        const [applicantsRes, validatorsRes, invitesRes] = await Promise.all([
          fetch("/api/admin/applicants?limit=1", {
            headers: { "x-admin-id": adminId! },
          }),
          fetch("/api/admin/validators", {
            headers: { "x-admin-id": adminId! },
          }),
          fetch("/api/admin/invites", {
            headers: { "x-admin-id": adminId! },
          }),
        ]);

        const applicants = applicantsRes.ok ? await applicantsRes.json() : null;
        const validators = validatorsRes.ok ? await validatorsRes.json() : null;
        const invites = invitesRes.ok ? await invitesRes.json() : null;

        setStats({
          totalApplicants: applicants?.meta?.total ?? 0,
          totalValidators: validators?.data?.length ?? 0,
          totalLinks: invites?.data?.length ?? 0,
          activeLinks:
            invites?.data?.filter((l: { is_active: boolean }) => l.is_active)
              .length ?? 0,
          totalApplications: 0,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }

    load();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Applicants",
          value: stats.totalApplicants,
          icon: Users,
          color: "text-ocean-400",
          bg: "bg-ocean-50 dark:bg-ocean-400/10",
        },
        {
          label: "Validators",
          value: stats.totalValidators,
          icon: ShieldCheck,
          color: "text-sage-500",
          bg: "bg-sage-50 dark:bg-sage-400/10",
        },
        {
          label: "Active Reg. Links",
          value: stats.activeLinks,
          icon: LinkIcon,
          color: "text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-400/10",
        },
        {
          label: "Total Reg. Links",
          value: stats.totalLinks,
          icon: FileText,
          color: "text-coral-400",
          bg: "bg-coral-50 dark:bg-coral-400/10",
        },
      ]
    : [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome section */}
      <motion.div
        variants={item}
        className="flex flex-col items-center gap-6 py-4"
      >
        <Image
          src="/mariveles-seal.png"
          alt="Mariveles Seal"
          width={120}
          height={120}
          className="drop-shadow-lg"
          priority
        />
        <div className="text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="font-body text-muted-fg mt-2">
            Iskolar ng Mariveles — Scholarship Management System
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      {stats && (
        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} padding="md" hover>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs font-body text-muted-fg">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
