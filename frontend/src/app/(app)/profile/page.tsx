/* ================================================================
   PROFILE SECTION
   Read-only view of all basic information (Personal, Parents, Education, Others)
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Heart, GraduationCap, Trophy } from "lucide-react";
import { Card, Breadcrumb, Skeleton } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import {
  useSession,
  getApplicantId,
} from "@/components/providers/SessionProvider";

/* ─── Sub-tab definitions ─── */
const SUB_TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "parents", label: "Parents", icon: Heart },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "others", label: "Others", icon: Trophy },
] as const;
type SubTabKey = (typeof SUB_TABS)[number]["key"];

/* ─── Data shape ─── */
interface ProfileData {
  /* personal */
  date_of_birth: string;
  gender: string;
  blood_type: string;
  civil_status: string;
  maiden_name: string;
  spouse_name: string;
  spouse_occupation: string;
  religion: string;
  height_cm: string;
  weight_kg: string;
  birthplace: string;
  contact_number: string;
  house_street: string;
  town: string;
  barangay: string;
  /* parents */
  father_name: string;
  father_occupation: string;
  father_contact: string;
  mother_name: string;
  mother_occupation: string;
  mother_contact: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_contact: string;
  /* education */
  course: string;
  college: string;
  year_level: string;
  student_number: string;
  gpa: string;
  primary_school: string;
  primary_address: string;
  primary_year_graduated: string;
  secondary_school: string;
  secondary_address: string;
  secondary_year_graduated: string;
  tertiary_school: string;
  tertiary_address: string;
  tertiary_year_graduated: string;
  tertiary_program: string;
  /* others */
  skills: string;
  hobbies: string;
  organizations: string;
  awards: string;
}

/* -- Animations -- */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ======================== PROFILE PAGE ======================== */

export default function ProfilePage() {
  const { user, loading: sessionLoading } = useSession();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<SubTabKey>("personal");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const applicantId = getApplicantId();
      if (!applicantId) throw new Error("Not logged in");
      const res = await fetch("/api/me/basic-info", {
        headers: { "x-applicant-id": String(applicantId) },
      });
      if (!res.ok) throw new Error("Failed to load");
      const { data: d } = await res.json();
      setData({
        date_of_birth: d.date_of_birth ?? "",
        gender: d.gender ?? "",
        blood_type: d.blood_type ?? "",
        civil_status: d.civil_status ?? "",
        maiden_name: d.maiden_name ?? "",
        spouse_name: d.spouse_name ?? "",
        spouse_occupation: d.spouse_occupation ?? "",
        religion: d.religion ?? "",
        height_cm: d.height_cm != null ? String(d.height_cm) : "",
        weight_kg: d.weight_kg != null ? String(d.weight_kg) : "",
        birthplace: d.birthplace ?? "",
        contact_number: d.contact_number ?? "",
        house_street: d.house_street ?? "",
        town: d.town ?? "",
        barangay: d.barangay ?? "",
        father_name: d.father_name ?? "",
        father_occupation: d.father_occupation ?? "",
        father_contact: d.father_contact ?? "",
        mother_name: d.mother_name ?? "",
        mother_occupation: d.mother_occupation ?? "",
        mother_contact: d.mother_contact ?? "",
        guardian_name: d.guardian_name ?? "",
        guardian_relation: d.guardian_relation ?? "",
        guardian_contact: d.guardian_contact ?? "",
        course: d.course ?? "",
        college: d.college ?? "",
        year_level: d.year_level != null ? String(d.year_level) : "",
        student_number: d.student_number ?? "",
        gpa: d.gpa != null ? String(d.gpa) : "",
        primary_school: d.primary_school ?? "",
        primary_address: d.primary_address ?? "",
        primary_year_graduated:
          d.primary_year_graduated != null
            ? String(d.primary_year_graduated)
            : "",
        secondary_school: d.secondary_school ?? "",
        secondary_address: d.secondary_address ?? "",
        secondary_year_graduated:
          d.secondary_year_graduated != null
            ? String(d.secondary_year_graduated)
            : "",
        tertiary_school: d.tertiary_school ?? "",
        tertiary_address: d.tertiary_address ?? "",
        tertiary_year_graduated:
          d.tertiary_year_graduated != null
            ? String(d.tertiary_year_graduated)
            : "",
        tertiary_program: d.tertiary_program ?? "",
        skills: d.skills ?? "",
        hobbies: d.hobbies ?? "",
        organizations: d.organizations ?? "",
        awards: d.awards ?? "",
      });
    } catch {
      addToast("Failed to load profile data", "error");
    } finally {
      setLoadingData(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loading = sessionLoading || loadingData;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const _fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const _initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
    : "";
  void _fullName;
  void _initials;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profile" },
          ]}
        />
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={fadeUp}>
        <Card className="relative overflow-hidden">
          <div
            className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-ocean-400/10 to-peach-300/10 rounded-full blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              My Profile
            </h1>
            <p className="font-body text-sm text-muted-fg mt-1">
              View your personal information.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Sub-tabs */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-1 border-b border-card-border">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2.5 text-sm font-body font-medium transition-colors relative flex items-center gap-1.5
                ${
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-ocean-400 hover:text-ocean-500"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-ocean-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={fadeUp}>
        <Card>
          {activeTab === "personal" && data && <PersonalTab data={data} />}
          {activeTab === "parents" && data && <ParentsTab data={data} />}
          {activeTab === "education" && data && <EducationTab data={data} />}
          {activeTab === "others" && data && <OthersTab data={data} />}
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ======================== READ-ONLY TAB COMPONENTS ======================== */

/* ── Personal Information ── */
function PersonalTab({ data }: { data: ProfileData }) {
  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Basic Details</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        <InfoRow label="Birthdate" value={formatDate(data.date_of_birth)} />
        <InfoRow label="Gender" value={data.gender} />
        <InfoRow label="Blood Type" value={data.blood_type} />
        <InfoRow label="Civil Status" value={data.civil_status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        <InfoRow label="Maiden Name" value={data.maiden_name} />
        <InfoRow label="Spouse Name" value={data.spouse_name} />
        <InfoRow label="Spouse Occupation" value={data.spouse_occupation} />
        <InfoRow label="Religion" value={data.religion} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        <InfoRow
          label="Height"
          value={data.height_cm ? `${data.height_cm} cm` : ""}
        />
        <InfoRow
          label="Weight"
          value={data.weight_kg ? `${data.weight_kg} kg` : ""}
        />
        <InfoRow label="Birthplace" value={data.birthplace} />
        <InfoRow label="Contact Number" value={data.contact_number} />
      </div>

      <SectionTitle>Address</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="House/Unit/Street" value={data.house_street} />
        <InfoRow label="Town" value={data.town} />
        <InfoRow label="Barangay" value={data.barangay} />
      </div>
    </div>
  );
}

/* ── Parents / Guardian ── */
function ParentsTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Father&rsquo;s Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="Full Name" value={data.father_name} />
        <InfoRow label="Occupation" value={data.father_occupation} />
        <InfoRow label="Contact Number" value={data.father_contact} />
      </div>

      <SectionTitle>Mother&rsquo;s Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="Full Name" value={data.mother_name} />
        <InfoRow label="Occupation" value={data.mother_occupation} />
        <InfoRow label="Contact Number" value={data.mother_contact} />
      </div>

      <SectionTitle>Guardian&rsquo;s Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="Full Name" value={data.guardian_name} />
        <InfoRow label="Relationship" value={data.guardian_relation} />
        <InfoRow label="Contact Number" value={data.guardian_contact} />
      </div>
    </div>
  );
}

/* ── Education ── */
function EducationTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Primary</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="School Name" value={data.primary_school} />
        <InfoRow label="Address" value={data.primary_address} />
        <InfoRow label="Year Graduated" value={data.primary_year_graduated} />
      </div>

      <SectionTitle>Secondary</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <InfoRow label="School Name" value={data.secondary_school} />
        <InfoRow label="Address" value={data.secondary_address} />
        <InfoRow label="Year Graduated" value={data.secondary_year_graduated} />
      </div>

      <SectionTitle>Tertiary (Post-Secondary)</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <InfoRow label="School Name" value={data.tertiary_school} />
        <InfoRow label="Program" value={data.tertiary_program} />
        <InfoRow label="Address" value={data.tertiary_address} />
        <InfoRow label="Year Graduated" value={data.tertiary_year_graduated} />
      </div>
    </div>
  );
}

/* ── Others ── */
function OthersTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <InfoBlock label="Skills" value={data.skills} />
        <InfoBlock label="Hobbies" value={data.hobbies} />
        <InfoBlock label="Organizations" value={data.organizations} />
        <InfoBlock label="Awards & Achievements" value={data.awards} />
      </div>
    </div>
  );
}

/* ======================== HELPER COMPONENTS ======================== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-base font-semibold text-foreground border-b border-card-border pb-2">
      {children}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-body text-muted-fg">{label}</p>
      <p className="text-sm font-body font-medium text-foreground mt-0.5">
        {value || "—"}
      </p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-body text-muted-fg mb-1">{label}</p>
      <div className="bg-muted rounded-xl px-4 py-3 min-h-[60px]">
        <p className="text-sm font-body text-foreground whitespace-pre-wrap">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
