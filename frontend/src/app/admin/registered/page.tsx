/* ================================================================
   ADMIN — REGISTERED APPLICANTS
   List all applicants across all barangays with search, barangay
   filter, and popup modal for applicant details.
   Mirrors the staff "List of Applicants" page.
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  User,
  Mail,
  Phone,
  Home,
  Loader2,
  X,
  Filter,
  Heart,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";

/* ── Constants ─────────────────────────────────────────── */
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

/* ── Types ─────────────────────────────────────────────── */
interface ApplicantRow {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  barangay: string | null;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  rejected_requirements: number;
}

interface ApplicationDetail {
  id: number;
  applicant_id: number;
  status: string;
  submitted_at: string | null;
  applicant_name: string;
  applicant_email: string;
  contact_number: string | null;
  address: string | null;
  /* basic info – personal */
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  civil_status: string | null;
  maiden_name: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  religion: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birthplace: string | null;
  house_street: string | null;
  town: string | null;
  barangay: string | null;
  /* basic info – parents */
  father_name: string | null;
  father_occupation: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  mother_contact: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  /* basic info – education */
  primary_school: string | null;
  primary_address: string | null;
  primary_year_graduated: string | null;
  secondary_school: string | null;
  secondary_address: string | null;
  secondary_year_graduated: string | null;
  tertiary_school: string | null;
  tertiary_address: string | null;
  tertiary_year_graduated: string | null;
  tertiary_program: string | null;
  /* basic info – others */
  skills: string | null;
  hobbies: string | null;
  organizations: string | null;
  awards: string | null;
}

interface RequirementSummary {
  requirement_key: string;
  status: string;
}

/* ── Animations ────────────────────────────────────────── */
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

/* ── Detail row helper ─────────────────────────────────── */
function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-muted-fg mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-body text-muted-fg leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-body text-foreground font-medium break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function RegisteredApplicantsPage() {
  const [allApplicants, setAllApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");

  // Modal state
  const [modalApplicant, setModalApplicant] = useState<ApplicantRow | null>(
    null,
  );
  const [activeInfoTab, setActiveInfoTab] = useState<
    "personal" | "parents" | "education" | "others"
  >("personal");
  const [detailCache, setDetailCache] = useState<
    Record<number, { app: ApplicationDetail; reqs: RequirementSummary[] }>
  >({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  const adminId =
    typeof window !== "undefined" ? localStorage.getItem("adminId") : null;

  /* ── Load list ───────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBarangay) params.set("barangay", filterBarangay);

      const res = await fetch(`/api/admin/registered?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (res.ok) {
        const data = await res.json();
        const grouped: Record<string, ApplicantRow[]> = data.grouped || {};
        const flat: ApplicantRow[] = Object.values(grouped).flat();
        setAllApplicants(flat);
      }
    } catch (e) {
      console.error("[AdminRegistered] Failed to load", e);
    } finally {
      setLoading(false);
    }
  }, [adminId, filterBarangay]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Fetch detail for a single applicant ─────────────── */
  const fetchDetail = useCallback(
    async (applicationId: number) => {
      if (!adminId || detailCache[applicationId]) return;
      setDetailLoading(applicationId);
      try {
        const res = await fetch(`/api/admin/registered/${applicationId}`, {
          headers: { "x-admin-id": adminId },
        });
        if (res.ok) {
          const json = await res.json();
          setDetailCache((prev) => ({
            ...prev,
            [applicationId]: {
              app: json.data as ApplicationDetail,
              reqs: (json.requirements ?? []).map(
                (r: { requirement_key: string; status: string }) => ({
                  requirement_key: r.requirement_key,
                  status: r.status,
                }),
              ),
            },
          }));
        }
      } catch (e) {
        console.error("Failed to fetch detail", e);
      } finally {
        setDetailLoading(null);
      }
    },
    [adminId, detailCache],
  );

  /* ── Open modal ──────────────────────────────────────── */
  const openModal = (applicant: ApplicantRow) => {
    setModalApplicant(applicant);
    fetchDetail(applicant.application_id);
  };

  /* ── Search filter ───────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!search.trim()) return allApplicants;
    const q = search.toLowerCase();
    return allApplicants.filter(
      (a) =>
        a.applicant_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [allApplicants, search]);

  const pendingCount = filtered.filter(
    (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
  ).length;

  // Barangay counts for chips
  const barangayCounts: Record<string, number> = {};
  for (const a of allApplicants) {
    const brgy = a.barangay || "Unknown";
    barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
  }

  // Modal detail data
  const detail = modalApplicant
    ? detailCache[modalApplicant.application_id]
    : null;
  const isLoadingDetail = modalApplicant
    ? detailLoading === modalApplicant.application_id
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-ocean-400" />
            List of Applicants
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            {allApplicants.length} applicant
            {allApplicants.length !== 1 ? "s" : ""} across all barangays
            {pendingCount > 0 && (
              <span className="text-amber-500 font-medium">
                {" "}
                &middot; {pendingCount} pending
              </span>
            )}
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
        <Card padding="md" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicant by name or email..."
              className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
            />
          </div>
        </Card>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg z-10" />
          <select
            value={filterBarangay}
            onChange={(e) => setFilterBarangay(e.target.value)}
            className="bg-card-bg border border-card-border rounded-xl pl-10 pr-8 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ocean-400/20 focus:border-ocean-400 transition-all appearance-none h-full"
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

      {/* Applicant list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
          <p className="font-heading text-lg font-semibold text-foreground mb-1">
            {search ? "No Results" : "No Applicants"}
          </p>
          <p className="font-body text-sm text-muted-fg">
            {search
              ? "No applicants match your search."
              : "There are no submitted applications at this time."}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {filtered.map((a, idx) => {
            const docsSubmitted = a.submitted_requirements;
            const docsTotal = a.total_requirements;
            const progress =
              docsTotal > 0
                ? Math.round((a.approved_requirements / docsTotal) * 100)
                : 0;

            return (
              <motion.div key={a.application_id} variants={fadeUp}>
                <button
                  onClick={() => openModal(a)}
                  className="w-full text-left"
                >
                  <Card hover padding="md">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Name + barangay */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-body font-semibold text-foreground truncate">
                            {idx + 1}. {a.applicant_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-fg font-body">
                            <span className="truncate">{a.email}</span>
                            {a.barangay && (
                              <>
                                <span>&middot;</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {a.barangay}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Requirement stats */}
                      <div className="flex items-center gap-3 text-xs font-body flex-shrink-0">
                        <div className="flex items-center gap-2 w-24">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sage-400 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-muted-fg whitespace-nowrap">
                            {docsSubmitted}/{docsTotal}
                          </span>
                        </div>
                        {a.approved_requirements > 0 && (
                          <span className="inline-flex items-center gap-1 text-sage-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {a.approved_requirements}
                          </span>
                        )}
                        {a.pending_requirements > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Clock className="w-3.5 h-3.5" />
                            {a.pending_requirements}
                          </span>
                        )}
                        {a.rejected_requirements > 0 && (
                          <span className="inline-flex items-center gap-1 text-coral-400">
                            <XCircle className="w-3.5 h-3.5" />
                            {a.rejected_requirements}
                          </span>
                        )}
                        {docsSubmitted === 0 && (
                          <span className="inline-flex items-center gap-1 text-muted-fg">
                            <AlertCircle className="w-3.5 h-3.5" />
                            No docs
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Applicant Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {modalApplicant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) =>
              e.target === e.currentTarget && setModalApplicant(null)
            }
            role="dialog"
            aria-modal="true"
            aria-label="Applicant details"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-card-bg border border-card-border rounded-2xl shadow-soft-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-card-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ocean-300 to-ocean-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-heading font-bold text-sm">
                      {modalApplicant.applicant_name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-base font-bold text-foreground truncate">
                      {modalApplicant.applicant_name}
                    </h2>
                    <p className="text-xs font-body text-muted-fg">
                      Applicant Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalApplicant(null)}
                  className="p-2 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4 space-y-5 overflow-y-auto">
                {isLoadingDetail && !detail ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-fg font-body">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading details…
                  </div>
                ) : detail ? (
                  <>
                    {/* Contact summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem
                        icon={User}
                        label="Full Name"
                        value={detail.app.applicant_name}
                      />
                      <DetailItem
                        icon={Mail}
                        label="Email"
                        value={detail.app.applicant_email}
                      />
                      <DetailItem
                        icon={Phone}
                        label="Contact Number"
                        value={detail.app.contact_number || "Not provided"}
                      />
                      <DetailItem
                        icon={Home}
                        label="Address"
                        value={detail.app.address || "Not provided"}
                      />
                    </div>

                    {/* Basic Information tabs */}
                    <div>
                      <h3 className="text-xs font-heading font-semibold text-muted-fg uppercase tracking-wider mb-3">
                        Basic Information
                      </h3>
                      <div className="flex gap-1 border-b border-card-border mb-4">
                        {[
                          {
                            key: "personal" as const,
                            label: "Personal",
                            icon: User,
                          },
                          {
                            key: "parents" as const,
                            label: "Parents",
                            icon: Heart,
                          },
                          {
                            key: "education" as const,
                            label: "Education",
                            icon: GraduationCap,
                          },
                          {
                            key: "others" as const,
                            label: "Others",
                            icon: Trophy,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveInfoTab(tab.key)}
                            className={`
                              px-3 py-2 text-xs font-body font-medium transition-colors relative flex items-center gap-1.5
                              ${
                                activeInfoTab === tab.key
                                  ? "text-foreground"
                                  : "text-ocean-400 hover:text-ocean-500"
                              }
                            `}
                          >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {activeInfoTab === tab.key && (
                              <motion.div
                                layoutId="modal-info-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-ocean-400"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {activeInfoTab === "personal" && (
                        <div className="space-y-4">
                          <ModalSectionTitle>Basic Details</ModalSectionTitle>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Birthdate"
                              value={formatDateStr(detail.app.date_of_birth)}
                            />
                            <ModalInfoRow
                              label="Gender"
                              value={detail.app.gender}
                            />
                            <ModalInfoRow
                              label="Blood Type"
                              value={detail.app.blood_type}
                            />
                            <ModalInfoRow
                              label="Civil Status"
                              value={detail.app.civil_status}
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Maiden Name"
                              value={detail.app.maiden_name}
                            />
                            <ModalInfoRow
                              label="Spouse Name"
                              value={detail.app.spouse_name}
                            />
                            <ModalInfoRow
                              label="Spouse Occupation"
                              value={detail.app.spouse_occupation}
                            />
                            <ModalInfoRow
                              label="Religion"
                              value={detail.app.religion}
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Height"
                              value={
                                detail.app.height_cm != null
                                  ? `${detail.app.height_cm} cm`
                                  : null
                              }
                            />
                            <ModalInfoRow
                              label="Weight"
                              value={
                                detail.app.weight_kg != null
                                  ? `${detail.app.weight_kg} kg`
                                  : null
                              }
                            />
                            <ModalInfoRow
                              label="Birthplace"
                              value={detail.app.birthplace}
                            />
                            <ModalInfoRow
                              label="Contact Number"
                              value={detail.app.contact_number}
                            />
                          </div>
                          <ModalSectionTitle>Address</ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="House/Unit/Street"
                              value={detail.app.house_street}
                            />
                            <ModalInfoRow
                              label="Town"
                              value={detail.app.town}
                            />
                            <ModalInfoRow
                              label="Barangay"
                              value={detail.app.barangay}
                            />
                          </div>
                        </div>
                      )}

                      {activeInfoTab === "parents" && (
                        <div className="space-y-4">
                          <ModalSectionTitle>
                            Father&rsquo;s Information
                          </ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Full Name"
                              value={detail.app.father_name}
                            />
                            <ModalInfoRow
                              label="Occupation"
                              value={detail.app.father_occupation}
                            />
                            <ModalInfoRow
                              label="Contact Number"
                              value={detail.app.father_contact}
                            />
                          </div>
                          <ModalSectionTitle>
                            Mother&rsquo;s Information
                          </ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Full Name"
                              value={detail.app.mother_name}
                            />
                            <ModalInfoRow
                              label="Occupation"
                              value={detail.app.mother_occupation}
                            />
                            <ModalInfoRow
                              label="Contact Number"
                              value={detail.app.mother_contact}
                            />
                          </div>
                          <ModalSectionTitle>
                            Guardian&rsquo;s Information
                          </ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="Full Name"
                              value={detail.app.guardian_name}
                            />
                            <ModalInfoRow
                              label="Relationship"
                              value={detail.app.guardian_relation}
                            />
                            <ModalInfoRow
                              label="Contact Number"
                              value={detail.app.guardian_contact}
                            />
                          </div>
                        </div>
                      )}

                      {activeInfoTab === "education" && (
                        <div className="space-y-4">
                          <ModalSectionTitle>Primary</ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="School Name"
                              value={detail.app.primary_school}
                            />
                            <ModalInfoRow
                              label="Address"
                              value={detail.app.primary_address}
                            />
                            <ModalInfoRow
                              label="Year Graduated"
                              value={detail.app.primary_year_graduated}
                            />
                          </div>
                          <ModalSectionTitle>Secondary</ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="School Name"
                              value={detail.app.secondary_school}
                            />
                            <ModalInfoRow
                              label="Address"
                              value={detail.app.secondary_address}
                            />
                            <ModalInfoRow
                              label="Year Graduated"
                              value={detail.app.secondary_year_graduated}
                            />
                          </div>
                          <ModalSectionTitle>
                            Tertiary (Post-Secondary)
                          </ModalSectionTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <ModalInfoRow
                              label="School Name"
                              value={detail.app.tertiary_school}
                            />
                            <ModalInfoRow
                              label="Program"
                              value={detail.app.tertiary_program}
                            />
                            <ModalInfoRow
                              label="Address"
                              value={detail.app.tertiary_address}
                            />
                            <ModalInfoRow
                              label="Year Graduated"
                              value={detail.app.tertiary_year_graduated}
                            />
                          </div>
                        </div>
                      )}

                      {activeInfoTab === "others" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <ModalInfoBlock
                              label="Skills"
                              value={detail.app.skills}
                            />
                            <ModalInfoBlock
                              label="Hobbies"
                              value={detail.app.hobbies}
                            />
                            <ModalInfoBlock
                              label="Organizations"
                              value={detail.app.organizations}
                            />
                            <ModalInfoBlock
                              label="Awards & Achievements"
                              value={detail.app.awards}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Requirement status badges */}
                    <div>
                      <h3 className="text-xs font-heading font-semibold text-muted-fg uppercase tracking-wider mb-2">
                        Requirements Status
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.reqs.map((r) => {
                          const variant =
                            r.status === "approved"
                              ? "success"
                              : r.status === "rejected"
                                ? "error"
                                : r.status === "pending"
                                  ? "warning"
                                  : "neutral";
                          return (
                            <Badge
                              key={r.requirement_key}
                              variant={variant}
                              dot
                            >
                              {r.requirement_key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                              — {r.status}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-fg/30 mx-auto mb-2" />
                    <p className="text-sm font-body text-muted-fg">
                      Could not load applicant details.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-5 py-4 border-t border-card-border flex items-center justify-end gap-3 shrink-0">
                <div className="text-xs font-body text-muted-fg">
                  {modalApplicant.pending_requirements > 0 && (
                    <span className="text-amber-500 font-medium">
                      {modalApplicant.pending_requirements} requirement
                      {modalApplicant.pending_requirements !== 1
                        ? "s"
                        : ""}{" "}
                      pending
                    </span>
                  )}
                  {modalApplicant.pending_requirements === 0 &&
                    modalApplicant.approved_requirements ===
                      modalApplicant.total_requirements &&
                    modalApplicant.total_requirements > 0 && (
                      <span className="text-sage-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All approved
                      </span>
                    )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================== MODAL HELPER COMPONENTS ======================== */

function formatDateStr(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ModalSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-heading text-sm font-semibold text-foreground border-b border-card-border pb-1.5">
      {children}
    </h4>
  );
}

function ModalInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-[11px] font-body text-muted-fg">{label}</p>
      <p className="text-sm font-body font-medium text-foreground mt-0.5">
        {value || "—"}
      </p>
    </div>
  );
}

function ModalInfoBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-[11px] font-body text-muted-fg mb-1">{label}</p>
      <div className="bg-muted rounded-xl px-3 py-2.5 min-h-[50px]">
        <p className="text-sm font-body text-foreground whitespace-pre-wrap">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
