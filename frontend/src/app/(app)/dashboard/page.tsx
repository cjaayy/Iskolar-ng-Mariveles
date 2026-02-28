/* ================================================================
   STUDENT DASHBOARD
   Personalized welcome, requirement cards, deadlines, activity feed
   ================================================================ */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Calendar,
  TrendingUp,
  Star,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  Badge,
  ProgressBar,
  CircularProgress,
  Skeleton,
} from "@/components/ui";
import { WavySeparator } from "@/components/illustrations";

/* -- Mock Data -- */
const studentName = "Maria";
const profileCompletion = 72;

const requirements = [
  {
    id: 1,
    name: "Enrollment Certificate",
    progress: 100,
    status: "approved" as const,
    dueDate: "2026-03-10",
  },
  {
    id: 2,
    name: "Certificate of Grades",
    progress: 100,
    status: "pending" as const,
    dueDate: "2026-03-15",
  },
  {
    id: 3,
    name: "Income Tax Return",
    progress: 50,
    status: "in-progress" as const,
    dueDate: "2026-03-20",
  },
  {
    id: 4,
    name: "Barangay Certificate",
    progress: 0,
    status: "missing" as const,
    dueDate: "2026-03-25",
  },
  {
    id: 5,
    name: "Community Service Log",
    progress: 30,
    status: "in-progress" as const,
    dueDate: "2026-04-01",
  },
];

const deadlines = [
  { label: "Income Tax Return", date: "2026-03-20", urgent: true },
  { label: "Barangay Certificate", date: "2026-03-25", urgent: false },
  { label: "Community Service Log", date: "2026-04-01", urgent: false },
];

const activities = [
  {
    id: 1,
    text: "Enrollment Certificate was approved",
    time: "2 hours ago",
    type: "success" as const,
  },
  {
    id: 2,
    text: "Certificate of Grades submitted for review",
    time: "5 hours ago",
    type: "info" as const,
  },
  {
    id: 3,
    text: "Income Tax Return partially uploaded",
    time: "1 day ago",
    type: "warning" as const,
  },
  {
    id: 4,
    text: "Profile information updated",
    time: "2 days ago",
    type: "info" as const,
  },
  {
    id: 5,
    text: "Scholarship application started",
    time: "5 days ago",
    type: "info" as const,
  },
];

const statusConfig = {
  approved: {
    label: "Approved",
    variant: "success" as const,
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending Review",
    variant: "warning" as const,
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    variant: "info" as const,
    icon: TrendingUp,
  },
  missing: { label: "Missing", variant: "error" as const, icon: AlertCircle },
};

/* -- Countdown Timer Hook -- */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      };
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

/* -- Countdown display component -- */
function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const { days, hours, minutes } = useCountdown(targetDate);
  const isUrgent = days <= 3;

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-body font-medium ${isUrgent ? "text-coral-400" : "text-muted-fg"}`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {days}d {hours}h {minutes}m
      </span>
    </div>
  );
}

/* -- Stagger animation helpers -- */
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

/* ======================== DASHBOARD PAGE ======================== */

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const completedCount = requirements.filter(
    (r) => r.status === "approved",
  ).length;
  const overallProgress = Math.round(
    requirements.reduce((sum, r) => sum + r.progress, 0) / requirements.length,
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ---- Welcome Section ---- */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-ocean-400/10 to-peach-300/10 rounded-full blur-2xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-peach-200/10 to-sage-200/10 rounded-full blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" aria-hidden="true">
                  👋
                </span>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  Magandang araw, {studentName}!
                </h1>
              </div>
              <p className="font-body text-muted-fg mt-1 max-w-lg">
                You&apos;ve completed{" "}
                <strong className="text-foreground">
                  {completedCount} of {requirements.length}
                </strong>{" "}
                requirements. Keep it up — you&apos;re doing great!
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm font-body">
                  <div className="w-8 h-8 rounded-lg bg-sage-100 dark:bg-sage-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-sage-500" />
                  </div>
                  <div>
                    <p className="text-muted-fg text-xs">Approved</p>
                    <p className="font-medium text-foreground">
                      {completedCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-body">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-muted-fg text-xs">Pending</p>
                    <p className="font-medium text-foreground">
                      {
                        requirements.filter((r) => r.status === "pending")
                          .length
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-body">
                  <div className="w-8 h-8 rounded-lg bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-coral-400" />
                  </div>
                  <div>
                    <p className="text-muted-fg text-xs">Missing</p>
                    <p className="font-medium text-foreground">
                      {
                        requirements.filter((r) => r.status === "missing")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completion Meter */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <CircularProgress
                value={profileCompletion}
                size={100}
                strokeWidth={8}
              >
                <div className="text-center">
                  <span className="text-xl font-heading font-bold text-foreground">
                    {profileCompletion}%
                  </span>
                </div>
              </CircularProgress>
              <span className="text-xs font-body text-muted-fg">
                Profile Complete
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---- Main Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requirements Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-ocean-400" />
                Requirements Progress
              </h2>
              <Link
                href="/requirements"
                className="text-sm font-body text-ocean-400 hover:text-ocean-500 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Overall progress */}
            <Card padding="sm" className="mb-4">
              <ProgressBar
                value={overallProgress}
                label="Overall Progress"
                size="lg"
                color={
                  overallProgress >= 80
                    ? "sage"
                    : overallProgress >= 50
                      ? "ocean"
                      : "amber"
                }
              />
            </Card>

            {/* Requirement Cards */}
            <motion.div variants={container} className="space-y-3">
              {requirements.map((req) => {
                const config = statusConfig[req.status];
                const StatusIcon = config.icon;
                return (
                  <motion.div key={req.id} variants={item}>
                    <Card hover padding="sm">
                      <div className="flex items-center gap-4">
                        {/* Status icon */}
                        <div
                          className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${req.status === "approved" ? "bg-sage-100 dark:bg-sage-500/10" : ""}
                          ${req.status === "pending" ? "bg-amber-50 dark:bg-amber-500/10" : ""}
                          ${req.status === "in-progress" ? "bg-ocean-50 dark:bg-ocean-400/10" : ""}
                          ${req.status === "missing" ? "bg-coral-50 dark:bg-coral-500/10" : ""}
                        `}
                        >
                          <StatusIcon
                            className={`w-5 h-5
                            ${req.status === "approved" ? "text-sage-500" : ""}
                            ${req.status === "pending" ? "text-amber-500" : ""}
                            ${req.status === "in-progress" ? "text-ocean-400" : ""}
                            ${req.status === "missing" ? "text-coral-400" : ""}
                          `}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-body font-medium text-foreground text-sm truncate">
                              {req.name}
                            </h3>
                            <Badge variant={config.variant} dot>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <ProgressBar
                              value={req.progress}
                              size="sm"
                              showValue={false}
                              color={
                                req.status === "approved"
                                  ? "sage"
                                  : req.status === "missing"
                                    ? "coral"
                                    : "ocean"
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-body text-muted-fg">
                              Due:{" "}
                              {new Date(req.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                            {req.status !== "approved" && (
                              <Link
                                href="/requirements"
                                className="text-xs font-body text-ocean-400 hover:underline flex items-center gap-0.5"
                              >
                                {req.status === "missing"
                                  ? "Upload"
                                  : "Continue"}
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Deadlines */}
          <motion.div variants={item}>
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-peach-400" />
              Upcoming Deadlines
            </h2>
            <Card padding="none" className="divide-y divide-card-border">
              {deadlines.map((dl, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">
                      {dl.label}
                    </p>
                    <p className="text-xs font-body text-muted-fg">
                      {new Date(dl.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <CountdownDisplay targetDate={dl.date} />
                </div>
              ))}
            </Card>
          </motion.div>

          <WavySeparator />

          {/* Activity Feed */}
          <motion.div variants={item}>
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400" />
              Recent Activity
            </h2>
            <Card padding="none" className="divide-y divide-card-border">
              {activities.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3">
                  <div
                    className={`
                    w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                    ${act.type === "success" ? "bg-sage-400" : ""}
                    ${act.type === "info" ? "bg-ocean-400" : ""}
                    ${act.type === "warning" ? "bg-amber-400" : ""}
                  `}
                  />
                  <div className="min-w-0">
                    <p className="font-body text-sm text-foreground">
                      {act.text}
                    </p>
                    <p className="text-xs font-body text-muted-fg mt-0.5">
                      {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>

          {/* Quick Upload CTA */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-ocean-50 to-peach-50 dark:from-ocean-400/5 dark:to-peach-300/5 border-dashed border-2 border-ocean-200 dark:border-ocean-400/20 text-center">
              <Upload className="w-8 h-8 text-ocean-400 mx-auto mb-2" />
              <p className="font-body text-sm font-medium text-foreground mb-1">
                Quick Upload
              </p>
              <p className="font-body text-xs text-muted-fg mb-3">
                Drag a file here or click to upload
              </p>
              <Link href="/requirements">
                <button className="text-sm font-body text-ocean-400 hover:text-ocean-500 font-medium hover:underline transition-colors">
                  Go to Requirements →
                </button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ======================== SKELETON LOADING ======================== */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome skeleton */}
      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton width="60%" height={28} variant="rectangular" />
            <Skeleton width="80%" />
            <div className="flex gap-4 mt-4">
              <Skeleton width={80} height={44} variant="rectangular" />
              <Skeleton width={80} height={44} variant="rectangular" />
              <Skeleton width={80} height={44} variant="rectangular" />
            </div>
          </div>
          <Skeleton width={100} height={100} variant="circular" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton width="40%" height={24} variant="rectangular" />
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} padding="sm">
              <div className="flex items-center gap-4">
                <Skeleton width={40} height={40} variant="rectangular" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="100%" height={8} variant="rectangular" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton width="50%" height={24} variant="rectangular" />
          <Card padding="none">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border-b border-card-border last:border-0"
              >
                <Skeleton width="70%" className="mb-2" />
                <Skeleton width="40%" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
