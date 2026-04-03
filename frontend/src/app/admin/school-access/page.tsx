"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
  CalendarDays,
  X,
  CheckSquare,
  Square,
  Filter,
  School,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";

type EducationLevel = "elementary" | "high_school" | "senior_high";

interface SchoolRow {
  id: number;
  school_name: string;
  education_level: EducationLevel;
  is_open: boolean;
  submission_open_date: string | null;
  submission_close_date: string | null;
  updated_at: string;
}

const EDUCATION_LEVELS: {
  value: EducationLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    value: "elementary",
    label: "Elementary",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-400/10",
    borderColor: "border-emerald-400 dark:border-emerald-500/50",
  },
  {
    value: "high_school",
    label: "High School",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-400/10",
    borderColor: "border-blue-400 dark:border-blue-500/50",
  },
  {
    value: "senior_high",
    label: "Senior High",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-400/10",
    borderColor: "border-purple-400 dark:border-purple-500/50",
  },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

function getLevelConfig(level: EducationLevel) {
  return EDUCATION_LEVELS.find((l) => l.value === level) || EDUCATION_LEVELS[2];
}

export default function SchoolAccessPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dateModalSchool, setDateModalSchool] = useState<string | null>(null);
  const [bulkDateModal, setBulkDateModal] = useState(false);
  const [bulkOpenDate, setBulkOpenDate] = useState("");
  const [bulkCloseDate, setBulkCloseDate] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<EducationLevel | "">("");

  const load = useCallback(async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel) params.set("educationLevel", filterLevel);

      const res = await fetch(`/api/admin/school-access?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const { data } = await res.json();
        setSchools(
          data.map((s: SchoolRow) => ({
            ...s,
            is_open: !!s.is_open,
            submission_open_date: s.submission_open_date || null,
            submission_close_date: s.submission_close_date || null,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterLevel]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (schoolName: string) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.school_name === schoolName ? { ...s, is_open: !s.is_open } : s,
      ),
    );
    setDirty(true);
    setSaved(false);
  };

  const setDate = (
    schoolName: string,
    field: "submission_open_date" | "submission_close_date",
    value: string,
  ) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.school_name === schoolName ? { ...s, [field]: value || null } : s,
      ),
    );
    setDirty(true);
    setSaved(false);
  };

  const toggleAll = (open: boolean) => {
    setSchools((prev) =>
      prev.map((s) => ({
        ...s,
        is_open: open,
        ...(open
          ? {}
          : { submission_open_date: null, submission_close_date: null }),
      })),
    );
    setDirty(true);
    setSaved(false);
  };

  const toggleByLevel = (level: EducationLevel, open: boolean) => {
    setSchools((prev) =>
      prev.map((s) =>
        s.education_level === level
          ? {
              ...s,
              is_open: open,
              ...(open
                ? {}
                : { submission_open_date: null, submission_close_date: null }),
            }
          : s,
      ),
    );
    setDirty(true);
    setSaved(false);
  };

  const openBulkDateModal = () => {
    setBulkOpenDate("");
    setBulkCloseDate("");
    setBulkSelected(new Set(schools.map((s) => s.school_name)));
    setBulkDateModal(true);
  };

  const toggleBulkSelect = (schoolName: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(schoolName)) next.delete(schoolName);
      else next.add(schoolName);
      return next;
    });
  };

  const toggleBulkAll = () => {
    if (bulkSelected.size === schools.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(schools.map((s) => s.school_name)));
    }
  };

  const applyBulkDates = () => {
    setSchools((prev) =>
      prev.map((s) =>
        bulkSelected.has(s.school_name)
          ? {
              ...s,
              is_open: true,
              submission_open_date: bulkOpenDate || null,
              submission_close_date: bulkCloseDate || null,
            }
          : s,
      ),
    );
    setDirty(true);
    setSaved(false);
    setBulkDateModal(false);
  };

  const save = async () => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) return;
    setSaving(true);
    try {
      const openSchools = schools
        .filter((s) => !!s.is_open)
        .map((s) => s.school_name);

      const submissionDates: Record<
        string,
        { open: string | null; close: string | null }
      > = {};
      for (const s of schools) {
        submissionDates[s.school_name] = {
          open: s.submission_open_date,
          close: s.submission_close_date,
        };
      }

      await fetch("/api/admin/school-access", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId,
        },
        body: JSON.stringify({ openSchools, submissionDates }),
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openCount = schools.filter((s) => s.is_open).length;
  const closedCount = schools.length - openCount;

  // Group schools by education level
  const groupedSchools = schools.reduce(
    (acc, school) => {
      const level = school.education_level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(school);
      return acc;
    },
    {} as Record<EducationLevel, SchoolRow[]>,
  );

  // Count by level
  const countByLevel = {
    elementary: schools.filter((s) => s.education_level === "elementary")
      .length,
    high_school: schools.filter((s) => s.education_level === "high_school")
      .length,
    senior_high: schools.filter((s) => s.education_level === "senior_high")
      .length,
  };

  const openByLevel = {
    elementary: schools.filter(
      (s) => s.education_level === "elementary" && s.is_open,
    ).length,
    high_school: schools.filter(
      (s) => s.education_level === "high_school" && s.is_open,
    ).length,
    senior_high: schools.filter(
      (s) => s.education_level === "senior_high" && s.is_open,
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <School className="w-7 h-7 text-ocean-400" />
            School Access Control
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            Control which schools can log in and submit requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            onClick={save}
            disabled={!dirty || saving}
            isLoading={saving}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="md" className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-fg" />
          <span className="text-sm font-body text-muted-fg">Filter:</span>
        </div>
        <button
          onClick={() => setFilterLevel("")}
          className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
            filterLevel === ""
              ? "bg-ocean-100 dark:bg-ocean-400/20 text-ocean-600 dark:text-ocean-400"
              : "bg-muted hover:bg-muted/80 text-muted-fg"
          }`}
        >
          All Schools ({schools.length})
        </button>
        {EDUCATION_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() =>
              setFilterLevel(filterLevel === level.value ? "" : level.value)
            }
            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
              filterLevel === level.value
                ? `${level.bgColor} ${level.color}`
                : "bg-muted hover:bg-muted/80 text-muted-fg"
            }`}
          >
            {level.label} ({countByLevel[level.value]})
          </button>
        ))}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-50 dark:bg-sage-400/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sage-500" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {openCount}
            </p>
            <p className="text-xs font-body text-muted-fg">Open Schools</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-coral-400" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {closedCount}
            </p>
            <p className="text-xs font-body text-muted-fg">Closed</p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 col-span-2">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toggleAll(true)}
              >
                Open All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toggleAll(false)}
              >
                Close All
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={openBulkDateModal}
            >
              <CalendarDays className="w-4 h-4 mr-1" />
              Set Dates for Multiple Schools
            </Button>
          </div>
        </Card>
      </div>

      {/* Level-wise Quick Toggle */}
      <Card padding="md">
        <p className="text-sm font-body font-medium text-foreground mb-3">
          Quick Toggle by Education Level
        </p>
        <div className="flex flex-wrap gap-2">
          {EDUCATION_LEVELS.map((level) => (
            <div key={level.value} className="flex items-center gap-1">
              <Badge className={`${level.bgColor} ${level.color} border-0`}>
                {level.label}: {openByLevel[level.value]}/
                {countByLevel[level.value]}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleByLevel(level.value, true)}
              >
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleByLevel(level.value, false)}
              >
                Close
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-card-bg border border-card-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {(filterLevel
            ? [[filterLevel, groupedSchools[filterLevel] || []] as const]
            : Object.entries(groupedSchools)
          ).map(([level, levelSchools]) => {
            const schools = levelSchools as SchoolRow[];
            if (!schools || schools.length === 0) return null;
            const config = getLevelConfig(level as EducationLevel);

            return (
              <div key={level as string}>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className={`w-5 h-5 ${config.color}`} />
                  <h2 className={`font-heading font-bold ${config.color}`}>
                    {config.label}
                  </h2>
                  <Badge
                    className={`${config.bgColor} ${config.color} border-0`}
                  >
                    {schools.filter((s) => s.is_open).length}
                    {" "}/ {schools.length} open
                  </Badge>
                </div>

                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {schools.map((s) => (
                    <motion.div key={s.id} variants={fadeUp}>
                      <div
                        className={`
                          w-full rounded-xl border-2 transition-all duration-200 overflow-hidden
                          ${
                            s.is_open
                              ? `bg-emerald-50/50 dark:bg-emerald-400/5 border-emerald-400 dark:border-emerald-500/50`
                              : `bg-red-50/50 dark:bg-red-400/5 border-red-400 dark:border-red-500/50`
                          }
                        `}
                      >
                        <button
                          onClick={() => toggle(s.school_name)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <School
                              className={`w-4 h-4 shrink-0 ${
                                s.is_open ? "text-sage-500" : "text-muted-fg"
                              }`}
                            />
                            <span
                              className={`text-sm font-body font-medium truncate ${
                                s.is_open ? "text-foreground" : "text-muted-fg"
                              }`}
                            >
                              {s.school_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={s.is_open ? "success" : "neutral"}>
                              {s.is_open ? "Open" : "Closed"}
                            </Badge>
                            {s.is_open ? (
                              <ToggleRight className="w-6 h-6 text-sage-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-muted-fg" />
                            )}
                          </div>
                        </button>

                        <div className="border-t border-card-border">
                          <button
                            onClick={() => setDateModalSchool(s.school_name)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-body text-muted-fg hover:text-foreground transition-colors"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            {s.is_open
                              ? s.submission_open_date ||
                                s.submission_close_date
                                ? `${s.submission_open_date ?? "—"} → ${s.submission_close_date ?? "—"}`
                                : "No expiry — open until closed"
                              : s.submission_open_date ||
                                  s.submission_close_date
                                ? `Scheduled: ${s.submission_open_date ?? "—"} → ${s.submission_close_date ?? "—"}`
                                : "Select a date to schedule"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* Date Modal for Single School */}
      {dateModalSchool &&
        (() => {
          const s = schools.find((x) => x.school_name === dateModalSchool);
          if (!s) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDateModalSchool(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative bg-card-bg border border-card-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-ocean-400" />
                    <h3 className="font-heading font-bold text-foreground text-lg">
                      Submission Dates
                    </h3>
                  </div>
                  <button
                    onClick={() => setDateModalSchool(null)}
                    className="p-1 rounded-lg hover:bg-muted-fg/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-fg" />
                  </button>
                </div>

                <p className="text-sm font-body text-muted-fg">
                  Set the submission window for{" "}
                  <span className="font-medium text-foreground">
                    {s.school_name}
                  </span>
                </p>

                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    Open Date
                  </label>
                  <input
                    type="date"
                    value={s.submission_open_date ?? ""}
                    onChange={(e) =>
                      setDate(
                        s.school_name,
                        "submission_open_date",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    Close Date
                  </label>
                  <input
                    type="date"
                    value={s.submission_close_date ?? ""}
                    onChange={(e) =>
                      setDate(
                        s.school_name,
                        "submission_close_date",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDate(s.school_name, "submission_open_date", "");
                      setDate(s.school_name, "submission_close_date", "");
                    }}
                  >
                    Clear Dates
                  </Button>
                  <Button size="sm" onClick={() => setDateModalSchool(null)}>
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}

      {/* Bulk Date Modal */}
      {bulkDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBulkDateModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-card-bg border border-card-border rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[80vh] overflow-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-ocean-400" />
                <h3 className="font-heading font-bold text-foreground text-lg">
                  Set Dates for Multiple Schools
                </h3>
              </div>
              <button
                onClick={() => setBulkDateModal(false)}
                className="p-1 rounded-lg hover:bg-muted-fg/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-fg" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                  Open Date
                </label>
                <input
                  type="date"
                  value={bulkOpenDate}
                  onChange={(e) => setBulkOpenDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                />
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                  Close Date
                </label>
                <input
                  type="date"
                  value={bulkCloseDate}
                  onChange={(e) => setBulkCloseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
                />
              </div>
            </div>

            <div className="border-t border-card-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-body font-medium text-foreground">
                  Select Schools ({bulkSelected.size} selected)
                </p>
                <button
                  onClick={toggleBulkAll}
                  className="text-xs font-body text-ocean-500 hover:underline"
                >
                  {bulkSelected.size === schools.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {schools.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleBulkSelect(s.school_name)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    {bulkSelected.has(s.school_name) ? (
                      <CheckSquare className="w-4 h-4 text-ocean-500" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-fg" />
                    )}
                    <span className="text-sm font-body text-foreground truncate flex-1">
                      {s.school_name}
                    </span>
                    <Badge
                      className={`${getLevelConfig(s.education_level).bgColor} ${getLevelConfig(s.education_level).color} border-0 text-[10px]`}
                    >
                      {getLevelConfig(s.education_level).label}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDateModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyBulkDates}
                disabled={bulkSelected.size === 0}
              >
                Apply to {bulkSelected.size} School
                {bulkSelected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
