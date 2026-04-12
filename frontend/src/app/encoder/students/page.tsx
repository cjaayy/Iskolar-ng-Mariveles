"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  School,
  Plus,
  AlertTriangle,
  Search,
  X,
  MapPin,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
} from "lucide-react";
import { Card, Button, Skeleton, Badge } from "@/components/ui";
import { useEncoderSession } from "@/components/providers/EncoderSessionProvider";
import { DocumentUploadModal } from "@/components/requirements/DocumentUploadModal";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

const YEAR_LEVELS = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

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

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const applicationStatusConfig: Record<
  string,
  { label: string; variant: BadgeVariant; icon: typeof CheckCircle2 }
> = {
  submitted: { label: "Submitted", variant: "info", icon: Clock },
  under_review: {
    label: "Under Review",
    variant: "warning",
    icon: AlertCircle,
  },
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "error", icon: XCircle },
  returned: { label: "Returned", variant: "neutral", icon: AlertCircle },
};

type RequirementStatus =
  | "approved"
  | "pending"
  | "in-progress"
  | "missing"
  | "rejected";

type RequirementGroup = "personal" | "academic" | "financial";

const requirementStatusConfig: Record<
  RequirementStatus,
  { label: string; variant: BadgeVariant }
> = {
  approved: { label: "Approved", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  "in-progress": { label: "In Progress", variant: "info" },
  missing: { label: "Missing", variant: "error" },
  rejected: { label: "Rejected", variant: "error" },
};

const groupLabels: Record<RequirementGroup, string> = {
  personal: "Personal Documents",
  academic: "Academic Records",
  financial: "Financial Documents",
};

const SCHOOL_LEVEL_LABELS: Record<string, string> = {
  elementary: "Elementary",
  high_school: "High School",
  senior_high: "Senior High",
};

const SCHOOL_LEVEL_HINTS: Record<string, string> = {
  elementary: "Grades 1-6",
  high_school: "Grades 7-10",
  senior_high: "Grades 11-12",
};

interface Student {
  user_id: number;
  applicant_id: number;
  full_name: string;
  barangay: string | null;
  year_level: string | null;
  application_status: string | null;
  created_at: string;
}

interface StudentDetail {
  applicant_id: number;
  user_id: number;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  contact_number: string | null;
  house_street: string | null;
  barangay: string | null;
  year_level: string | null;
  address: string | null;
  current_school: string | null;
}

interface BasicFormState {
  fullName: string;
  contactNumber: string;
  houseStreet: string;
  barangay: string;
  yearLevel: string;
  dateOfBirth: string;
  gender: string;
}

interface Requirement {
  id: number;
  key: string;
  name: string;
  description: string;
  status: RequirementStatus;
  progress: number;
  dueDate: string;
  helpTip: string;
  sampleUrl?: string;
  uploadedFile?: string | null;
  fileUrl?: string | null;
  group: RequirementGroup;
  validatorNotes?: string | null;
  validatedAt?: string | null;
}

const emptyBasicForm: BasicFormState = {
  fullName: "",
  contactNumber: "",
  houseStreet: "",
  barangay: "",
  yearLevel: "",
  dateOfBirth: "",
  gender: "",
};

export default function EncoderStudentsPage() {
  const { user, loading: sessionLoading } = useEncoderSession();
  const rawEncoderId =
    typeof window !== "undefined" ? localStorage.getItem("encoderId") : null;
  const trimmedEncoderId = rawEncoderId?.trim() || "";
  const encoderId =
    trimmedEncoderId &&
    trimmedEncoderId !== "undefined" &&
    trimmedEncoderId !== "null" &&
    (Number.isFinite(Number(trimmedEncoderId)) ||
      /^[0-9a-fA-F-]{36}$/.test(trimmedEncoderId))
      ? trimmedEncoderId
      : null;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  const [fullName, setFullName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [houseStreet, setHouseStreet] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "basic" | "requirements"
  >("profile");
  const [basicForm, setBasicForm] = useState<BasicFormState>(emptyBasicForm);
  const [savingBasic, setSavingBasic] = useState(false);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    name?: string;
    reqKey?: string;
  }>({ open: false });

  const assignedSchool = user?.assignedSchool ?? null;
  const assignedSchoolLevel = user?.assignedSchoolLevel ?? null;
  const canCreate = !!assignedSchool && !sessionLoading;

  const yearLevelOptions = useMemo(() => {
    if (assignedSchoolLevel === "elementary") return YEAR_LEVELS.slice(0, 6);
    if (assignedSchoolLevel === "high_school") return YEAR_LEVELS.slice(6, 10);
    if (assignedSchoolLevel === "senior_high") return YEAR_LEVELS.slice(10);
    return YEAR_LEVELS;
  }, [assignedSchoolLevel]);

  useEffect(() => {
    if (rawEncoderId && !encoderId && typeof window !== "undefined") {
      localStorage.removeItem("encoderId");
    }
  }, [rawEncoderId, encoderId]);

  const fetchStudents = useCallback(async () => {
    if (!encoderId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setListError("");
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/encoder/students?${params.toString()}`, {
        headers: { "x-encoder-id": encoderId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setListError(err.error || "Failed to fetch students");
        setStudents([]);
        return;
      }

      const json = await res.json();
      setStudents(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setListError("Failed to fetch students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [encoderId, search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchStudents, 250);
    return () => clearTimeout(timeout);
  }, [fetchStudents]);

  const loadDetail = useCallback(
    async (applicantId: number) => {
      if (!encoderId) return;
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/encoder/students/${applicantId}`, {
          headers: { "x-encoder-id": encoderId },
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data as StudentDetail;
          setDetail(data);
          setBasicForm({
            fullName: data.full_name ?? "",
            contactNumber: data.contact_number ?? "",
            houseStreet: data.house_street ?? "",
            barangay: data.barangay ?? "",
            yearLevel: data.year_level ?? "",
            dateOfBirth: data.date_of_birth ?? "",
            gender: data.gender ?? "",
          });
        }
      } catch (err) {
        console.error("Failed to load student detail:", err);
      } finally {
        setDetailLoading(false);
      }
    },
    [encoderId],
  );

  const loadRequirements = useCallback(
    async (applicantId: number) => {
      if (!encoderId) return;
      setRequirementsLoading(true);
      try {
        const res = await fetch(
          `/api/encoder/students/${applicantId}/requirements`,
          {
            headers: { "x-encoder-id": encoderId },
          },
        );
        if (res.ok) {
          const json = await res.json();
          setRequirements(json.requirements ?? []);
        }
      } catch (err) {
        console.error("Failed to load requirements:", err);
      } finally {
        setRequirementsLoading(false);
      }
    },
    [encoderId],
  );

  const openStudent = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab("profile");
    setRequirements([]);
    loadDetail(student.applicant_id);
    loadRequirements(student.applicant_id);
  };

  const closeStudent = () => {
    setSelectedStudent(null);
    setDetail(null);
    setActiveTab("profile");
    setBasicForm(emptyBasicForm);
    setRequirements([]);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!encoderId) return;
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/encoder/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-encoder-id": encoderId,
        },
        body: JSON.stringify({
          fullName,
          barangay,
          yearLevel,
          houseStreet: houseStreet || undefined,
          contactNumber: contactNumber || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCreateError(data.error || "Failed to create student");
      } else {
        setCreateSuccess("Student created successfully.");
        setFullName("");
        setBarangay("");
        setYearLevel("");
        setHouseStreet("");
        setContactNumber("");
        if (data?.student) {
          setStudents((prev) => [data.student, ...prev]);
        }
        fetchStudents();
      }
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleBasicSave = async () => {
    if (!encoderId || !selectedStudent) return;
    setSavingBasic(true);
    try {
      const res = await fetch(
        `/api/encoder/students/${selectedStudent.applicant_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-encoder-id": encoderId,
          },
          body: JSON.stringify({
            fullName: basicForm.fullName,
            contact_number: basicForm.contactNumber,
            house_street: basicForm.houseStreet,
            barangay: basicForm.barangay,
            year_level: basicForm.yearLevel,
            date_of_birth: basicForm.dateOfBirth,
            gender: basicForm.gender,
          }),
        },
      );

      if (res.ok) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                full_name: basicForm.fullName,
                contact_number: basicForm.contactNumber || null,
                house_street: basicForm.houseStreet || null,
                barangay: basicForm.barangay || null,
                year_level: basicForm.yearLevel || null,
                date_of_birth: basicForm.dateOfBirth || null,
                gender: basicForm.gender || null,
              }
            : prev,
        );
        setStudents((prev) =>
          prev.map((s) =>
            s.applicant_id === selectedStudent.applicant_id
              ? {
                  ...s,
                  full_name: basicForm.fullName,
                  barangay: basicForm.barangay || null,
                  year_level: basicForm.yearLevel || null,
                }
              : s,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update basic info:", err);
    } finally {
      setSavingBasic(false);
    }
  };

  const groupedRequirements = useMemo(() => {
    const grouped: Record<RequirementGroup, Requirement[]> = {
      personal: [],
      academic: [],
      financial: [],
    };
    for (const req of requirements) {
      grouped[req.group]?.push(req);
    }
    return grouped;
  }, [requirements]);

  if (!sessionLoading && !user) {
    return (
      <Card padding="lg">
        <div className="text-center py-6 space-y-3">
          <AlertTriangle className="w-10 h-10 text-coral-400 mx-auto" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Encoder session not found
          </h2>
          <p className="font-body text-sm text-muted-fg">
            Please sign in again to access the encoder workspace.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Back to login
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={item}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Students
            </h1>
            <p className="font-body text-sm text-muted-fg mt-0.5">
              Manage student registrations for your assigned school.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-fg absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name"
                className="w-full sm:w-56 bg-muted border-0 rounded-xl pl-9 pr-3 py-2 text-xs font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchStudents();
              }}
              isLoading={refreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowCreate((prev) => !prev)}
              leftIcon={
                showCreate ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )
              }
              disabled={!canCreate}
            >
              {showCreate ? "Cancel" : "Create Student"}
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <School className="w-5 h-5 text-muted-fg" />
                <div>
                  <p className="text-xs font-body text-muted-fg">
                    Assigned School
                  </p>
                  {sessionLoading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    <p className="font-body text-sm text-foreground">
                      {assignedSchool || "Unassigned"}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs font-body text-muted-fg">
                {assignedSchool
                  ? `Create students and upload their requirements here.${assignedSchoolLevel ? ` ${SCHOOL_LEVEL_LABELS[assignedSchoolLevel] || ""} levels only.` : ""}`
                  : "Assign a school to this encoder to enable student creation."}
              </div>
            </div>
          </Card>
        </motion.div>

        <AnimatePresence>
          {listError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-coral-600 dark:text-coral-400 font-body"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {listError}
              <button
                onClick={() => setListError("")}
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
                  Create Student
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Barangay
                      </label>
                      <select
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        required
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      >
                        <option value="">Select barangay</option>
                        {MARIVELES_BARANGAYS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Year Level
                      </label>
                      <select
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                        required
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      >
                        <option value="">Select year level</option>
                        {yearLevelOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      {assignedSchoolLevel && (
                        <p className="text-[11px] text-muted-fg mt-1 font-body">
                          {SCHOOL_LEVEL_LABELS[assignedSchoolLevel] || ""} level
                          ({SCHOOL_LEVEL_HINTS[assignedSchoolLevel] || ""})
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        House Street (optional)
                      </label>
                      <input
                        type="text"
                        value={houseStreet}
                        onChange={(e) => setHouseStreet(e.target.value)}
                        placeholder="House no., street"
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-fg mb-1">
                        Contact Number (optional)
                      </label>
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="09xxxxxxxxx"
                        className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                      />
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
                      Create Student
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={item}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} padding="md">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8 space-y-2">
                <Users className="w-12 h-12 text-muted-fg mx-auto opacity-40" />
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  No students yet
                </h3>
                <p className="font-body text-sm text-muted-fg">
                  Once you create a student, they will appear here for document
                  uploads and tracking.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const status = student.application_status || "submitted";
                const config =
                  applicationStatusConfig[status] ||
                  ({
                    label: "Pending",
                    variant: "neutral",
                    icon: AlertCircle,
                  } as const);
                const Icon = config.icon;
                return (
                  <Card key={student.applicant_id} padding="md" hover>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-foreground truncate">
                            {student.full_name}
                          </h3>
                          <Badge variant={config.variant} dot>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-muted-fg">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {student.barangay || "Barangay not set"}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {student.year_level || "Year level not set"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-body text-muted-fg">
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStudent(student)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeStudent}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full max-w-4xl bg-card-bg border border-card-border rounded-2xl shadow-soft-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {selectedStudent.full_name}
                  </h2>
                  <p className="text-xs font-body text-muted-fg">
                    {assignedSchool || "Assigned school"}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={closeStudent}>
                  Close
                </Button>
              </div>

              <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2 border-b border-card-border pb-3">
                  {[
                    { key: "profile", label: "Profile" },
                    { key: "basic", label: "Basic Info" },
                    { key: "requirements", label: "Requirements" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() =>
                        setActiveTab(
                          tab.key as "profile" | "basic" | "requirements",
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                        activeTab === tab.key
                          ? "bg-ocean-400 text-white"
                          : "bg-muted text-muted-fg hover:bg-card-border hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
                {detailLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                )}

                {!detailLoading && activeTab === "profile" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Full Name" value={detail?.full_name} />
                    <InfoRow label="Barangay" value={detail?.barangay} />
                    <InfoRow label="Year Level" value={detail?.year_level} />
                    <InfoRow
                      label="Contact Number"
                      value={detail?.contact_number}
                    />
                    <InfoRow
                      label="Date of Birth"
                      value={detail?.date_of_birth}
                    />
                    <InfoRow label="Gender" value={detail?.gender} />
                    <InfoRow label="Address" value={detail?.address} />
                    <InfoRow label="School" value={detail?.current_school} />
                  </div>
                )}

                {!detailLoading && activeTab === "basic" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={basicForm.fullName}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={basicForm.contactNumber}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              contactNumber: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={basicForm.dateOfBirth}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              dateOfBirth: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Gender
                        </label>
                        <select
                          value={basicForm.gender}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              gender: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Barangay
                        </label>
                        <select
                          value={basicForm.barangay}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              barangay: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        >
                          <option value="">Select barangay</option>
                          {MARIVELES_BARANGAYS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          Year Level
                        </label>
                        <select
                          value={basicForm.yearLevel}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              yearLevel: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        >
                          <option value="">Select year level</option>
                          {yearLevelOptions.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                        {assignedSchoolLevel && (
                          <p className="text-[11px] text-muted-fg mt-1 font-body">
                            {SCHOOL_LEVEL_LABELS[assignedSchoolLevel] || ""}{" "}
                            level (
                            {SCHOOL_LEVEL_HINTS[assignedSchoolLevel] || ""})
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted-fg mb-1">
                          House Street
                        </label>
                        <input
                          type="text"
                          value={basicForm.houseStreet}
                          onChange={(e) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              houseStreet: e.target.value,
                            }))
                          }
                          className="w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        isLoading={savingBasic}
                        onClick={handleBasicSave}
                      >
                        Save Basic Info
                      </Button>
                    </div>
                  </div>
                )}

                {!detailLoading && activeTab === "requirements" && (
                  <div className="space-y-4">
                    {requirementsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-72" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ) : (
                      Object.entries(groupedRequirements).map(
                        ([group, items]) => (
                          <div key={group} className="space-y-2">
                            <h3 className="text-sm font-heading font-semibold text-foreground">
                              {groupLabels[group as RequirementGroup]}
                            </h3>
                            {items.length === 0 ? (
                              <p className="text-xs font-body text-muted-fg">
                                No requirements in this group.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {items.map((req) => (
                                  <RequirementRow
                                    key={req.key}
                                    requirement={req}
                                    onUpload={() =>
                                      setUploadModal({
                                        open: true,
                                        name: req.name,
                                        reqKey: req.key,
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ),
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DocumentUploadModal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false })}
        requirementName={uploadModal.name}
        requirementKey={uploadModal.reqKey}
        applicantId={selectedStudent?.applicant_id}
        requirementsEndpoint={
          selectedStudent
            ? `/api/encoder/students/${selectedStudent.applicant_id}/requirements`
            : undefined
        }
        requirementsHeaders={
          encoderId ? { "x-encoder-id": encoderId } : undefined
        }
        onSuccess={() => {
          if (selectedStudent) {
            loadRequirements(selectedStudent.applicant_id);
          }
        }}
      />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-card-border bg-muted px-4 py-3">
      <p className="text-xs font-body text-muted-fg mb-1">{label}</p>
      <p className="text-sm font-body text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function RequirementRow({
  requirement,
  onUpload,
}: {
  requirement: Requirement;
  onUpload: () => void;
}) {
  const status = requirement.status || "missing";
  const config =
    requirementStatusConfig[status] || requirementStatusConfig.missing;

  return (
    <Card padding="md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h4 className="text-sm font-body font-medium text-foreground">
            {requirement.name}
          </h4>
          <p className="text-xs font-body text-muted-fg">
            {requirement.description}
          </p>
          {requirement.uploadedFile && (
            <p className="text-xs font-body text-muted-fg mt-1">
              Uploaded: {requirement.uploadedFile}
            </p>
          )}
          {requirement.validatorNotes && (
            <p className="text-xs font-body text-coral-500 mt-1">
              Note: {requirement.validatorNotes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onUpload}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload
          </Button>
        </div>
      </div>
    </Card>
  );
}
