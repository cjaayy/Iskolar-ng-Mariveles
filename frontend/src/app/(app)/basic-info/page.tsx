/* ================================================================
   BASIC INFORMATION PAGE
   Multi-tab form: Personal Information, Parents, Education, Others
   ================================================================ */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Card,
  Button,
  Input,
  Select,
  Breadcrumb,
  Skeleton,
} from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import {
  useSession,
  getApplicantId,
} from "@/components/providers/SessionProvider";

/* ─── Sub-tab definitions ─── */
const SUB_TABS = [
  "Personal Information",
  "Parents",
  "Education",
  "Others",
] as const;
type SubTab = (typeof SUB_TABS)[number];

/* ─── Form data shape (mirrors API response) ─── */
interface BasicInfoForm {
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
  /* education (read-only from session, editable extras) */
  primary_school: string;
  primary_address: string;
  primary_year_graduated: string;
  jhs_school: string;
  jhs_address: string;
  jhs_year_graduated: string;
  shs_school: string;
  shs_address: string;
  shs_year_graduated: string;
  /* others */
  skills: string;
  hobbies: string;
  organizations: string;
  awards: string;
}

const emptyForm: BasicInfoForm = {
  date_of_birth: "",
  gender: "",
  blood_type: "",
  civil_status: "",
  maiden_name: "",
  spouse_name: "",
  spouse_occupation: "",
  religion: "",
  height_cm: "",
  weight_kg: "",
  birthplace: "",
  contact_number: "",
  house_street: "",
  town: "",
  barangay: "",
  father_name: "",
  father_occupation: "",
  father_contact: "",
  mother_name: "",
  mother_occupation: "",
  mother_contact: "",
  guardian_name: "",
  guardian_relation: "",
  guardian_contact: "",
  primary_school: "",
  primary_address: "",
  primary_year_graduated: "",
  jhs_school: "",
  jhs_address: "",
  jhs_year_graduated: "",
  shs_school: "",
  shs_address: "",
  shs_year_graduated: "",
  skills: "",
  hobbies: "",
  organizations: "",
  awards: "",
};

/* ─── Select option data ─── */
const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const BLOOD_TYPE_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

const CIVIL_STATUS_OPTIONS = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Widowed", value: "Widowed" },
  { label: "Separated", value: "Separated" },
  { label: "Annulled", value: "Annulled" },
];

const RELIGION_OPTIONS = [
  { label: "Roman Catholic", value: "Roman Catholic" },
  { label: "Islam", value: "Islam" },
  { label: "Iglesia ni Cristo", value: "Iglesia ni Cristo" },
  { label: "Evangelical Christianity", value: "Evangelical Christianity" },
  {
    label: "Philippine Independent Church",
    value: "Philippine Independent Church",
  },
  { label: "Seventh-day Adventist", value: "Seventh-day Adventist" },
  { label: "Bible Baptist Church", value: "Bible Baptist Church" },
  { label: "Born Again Christian", value: "Born Again Christian" },
  { label: "Others", value: "Others" },
];

const TOWN_OPTIONS = [{ label: "Mariveles", value: "Mariveles" }];

const MARIVELES_BARANGAYS = [
  "Alas-asin",
  "Alion",
  "Balon-Anito",
  "Baseco Country",
  "Batangas II",
  "Biaan",
  "Cabcaben",
  "Camaya",
  "Ipag",
  "Lucanin",
  "Maligaya",
  "Mt. View",
  "Poblacion",
  "San Carlos",
  "San Isidro",
  "Sisiman",
  "Townsite",
].map((b) => ({ label: b, value: b }));

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ======================== PAGE COMPONENT ======================== */

export default function BasicInfoPage() {
  const { loading: sessionLoading } = useSession();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<SubTab>("Personal Information");
  const [form, setForm] = useState<BasicInfoForm>(emptyForm);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  /* ── Scroll to top of form ── */
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Load data from API ── */
  const loadData = useCallback(async () => {
    try {
      const applicantId = getApplicantId();
      if (!applicantId) throw new Error("Not logged in");
      const res = await fetch("/api/me/basic-info", {
        headers: { "x-applicant-id": String(applicantId) },
      });
      if (!res.ok) throw new Error("Failed to load");
      const { data } = await res.json();
      setForm({
        date_of_birth: data.date_of_birth ?? "",
        gender: data.gender ?? "",
        blood_type: data.blood_type ?? "",
        civil_status: data.civil_status ?? "",
        maiden_name: data.maiden_name ?? "",
        spouse_name: data.spouse_name ?? "",
        spouse_occupation: data.spouse_occupation ?? "",
        religion: data.religion ?? "",
        height_cm: data.height_cm != null ? String(data.height_cm) : "",
        weight_kg: data.weight_kg != null ? String(data.weight_kg) : "",
        birthplace: data.birthplace ?? "",
        contact_number: data.contact_number ?? "",
        house_street: data.house_street ?? "",
        town: data.town ?? "",
        barangay: data.barangay ?? "",
        father_name: data.father_name ?? "",
        father_occupation: data.father_occupation ?? "",
        father_contact: data.father_contact ?? "",
        mother_name: data.mother_name ?? "",
        mother_occupation: data.mother_occupation ?? "",
        mother_contact: data.mother_contact ?? "",
        guardian_name: data.guardian_name ?? "",
        guardian_relation: data.guardian_relation ?? "",
        guardian_contact: data.guardian_contact ?? "",
        primary_school: data.primary_school ?? "",
        primary_address: data.primary_address ?? "",
        primary_year_graduated:
          data.primary_year_graduated != null
            ? String(data.primary_year_graduated)
            : "",
        jhs_school: data.secondary_school ?? "",
        jhs_address: data.secondary_address ?? "",
        jhs_year_graduated:
          data.secondary_year_graduated != null
            ? String(data.secondary_year_graduated)
            : "",
        shs_school: data.tertiary_school ?? "",
        shs_address: data.tertiary_address ?? "",
        shs_year_graduated:
          data.tertiary_year_graduated != null
            ? String(data.tertiary_year_graduated)
            : "",
        skills: data.skills ?? "",
        hobbies: data.hobbies ?? "",
        organizations: data.organizations ?? "",
        awards: data.awards ?? "",
      });
    } catch {
      addToast("Failed to load basic information", "error");
    } finally {
      setLoadingData(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Field change helpers ── */
  const update = (field: keyof BasicInfoForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Save handler ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      // Convert numeric strings back to numbers
      if (payload.height_cm) payload.height_cm = Number(payload.height_cm);
      if (payload.weight_kg) payload.weight_kg = Number(payload.weight_kg);

      // Map JHS/SHS form fields to database column names
      payload.secondary_school = payload.jhs_school;
      payload.secondary_address = payload.jhs_address;
      payload.secondary_year_graduated = payload.jhs_year_graduated;
      delete payload.jhs_school;
      delete payload.jhs_address;
      delete payload.jhs_year_graduated;

      payload.tertiary_school = payload.shs_school;
      payload.tertiary_address = payload.shs_address;
      payload.tertiary_year_graduated = payload.shs_year_graduated;
      delete payload.shs_school;
      delete payload.shs_address;
      delete payload.shs_year_graduated;

      const res = await fetch("/api/me/basic-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-applicant-id": String(getApplicantId()),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      addToast("Saved", "success");
      return true;
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to save", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ── Save and go to next tab ── */
  const handleSaveAndNext = async () => {
    const success = await handleSave();
    if (success) {
      const currentIndex = SUB_TABS.indexOf(activeTab);
      if (currentIndex < SUB_TABS.length - 1) {
        setActiveTab(SUB_TABS[currentIndex + 1]);
        setTimeout(scrollToTop, 50);
      }
    }
  };

  /* ── Go to previous tab ── */
  const handlePrevious = () => {
    const currentIndex = SUB_TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(SUB_TABS[currentIndex - 1]);
      setTimeout(scrollToTop, 50);
    }
  };

  const isFirstTab = activeTab === SUB_TABS[0];
  const isLastTab = activeTab === SUB_TABS[SUB_TABS.length - 1];

  /* ── Loading state ── */
  if (sessionLoading || loadingData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      ref={topRef}
      className="max-w-5xl mx-auto space-y-6 px-4 py-8"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Basic Information" },
          ]}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={fadeUp}
        className="font-heading text-2xl md:text-3xl font-bold text-foreground"
      >
        Basic Information
      </motion.h1>

      {/* Sub-tabs */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-1 border-b border-card-border overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-body font-medium transition-colors relative whitespace-nowrap
                ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-ocean-400 hover:text-ocean-500"
                }
              `}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="basic-info-tab-underline"
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
          {activeTab === "Personal Information" && (
            <PersonalInfoTab form={form} update={update} />
          )}
          {activeTab === "Parents" && (
            <ParentsTab form={form} update={update} />
          )}
          {activeTab === "Education" && (
            <EducationTab form={form} update={update} />
          )}
          {activeTab === "Others" && <OthersTab form={form} update={update} />}

          {/* Navigation buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4 mt-8 pt-4 border-t border-card-border">
            <div>
              {!isFirstTab && (
                <Button
                  variant="success"
                  size="md"
                  onClick={handlePrevious}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
              )}
            </div>
            <Button
              variant="success"
              size="md"
              onClick={isLastTab ? handleSave : handleSaveAndNext}
              isLoading={saving}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving…" : isLastTab ? "Save" : "Save & Next"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ======================== SUB-TAB COMPONENTS ======================== */

interface TabProps {
  form: BasicInfoForm;
  update: (field: keyof BasicInfoForm, value: string) => void;
}

/* ── Personal Information ── */
function PersonalInfoTab({ form, update }: TabProps) {
  const isSingle = form.civil_status === "Single";
  const isWidowedSeparatedAnnulled = [
    "Widowed",
    "Separated",
    "Annulled",
  ].includes(form.civil_status);

  // Hide maiden name & spouse fields when Single; hide occupation of spouse when Widowed/Separated/Annulled
  const showMaidenName = !isSingle;
  const showSpouseName = !isSingle;
  const showSpouseOccupation = !isSingle && !isWidowedSeparatedAnnulled;

  const handleCivilStatusChange = (value: string) => {
    update("civil_status", value);
    if (value === "Single") {
      update("maiden_name", "");
      update("spouse_name", "");
      update("spouse_occupation", "");
    } else if (["Widowed", "Separated", "Annulled"].includes(value)) {
      update("spouse_occupation", "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Birthdate"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
        />
        <Select
          label="Gender"
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={(e) => update("gender", e.target.value)}
        />
        <Select
          label="Blood Type"
          options={BLOOD_TYPE_OPTIONS}
          value={form.blood_type}
          onChange={(e) => update("blood_type", e.target.value)}
        />
        <Select
          label="Civil Status"
          options={CIVIL_STATUS_OPTIONS}
          value={form.civil_status}
          onChange={(e) => handleCivilStatusChange(e.target.value)}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showMaidenName && (
          <Input
            label="Maiden Name"
            placeholder="Enter Maiden Name"
            value={form.maiden_name}
            onChange={(e) => update("maiden_name", e.target.value)}
          />
        )}
        {showSpouseName && (
          <Input
            label="Name of Spouse"
            placeholder="Enter Spouse's Name"
            value={form.spouse_name}
            onChange={(e) => update("spouse_name", e.target.value)}
          />
        )}
        {showSpouseOccupation && (
          <Input
            label="Occupation of Spouse"
            placeholder="Enter Spouse's Occupation"
            value={form.spouse_occupation}
            onChange={(e) => update("spouse_occupation", e.target.value)}
          />
        )}
        <Select
          label="Religion"
          options={RELIGION_OPTIONS}
          value={form.religion}
          onChange={(e) => update("religion", e.target.value)}
        />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Height (cm)"
          placeholder="In centimeters"
          type="number"
          value={form.height_cm}
          onChange={(e) => update("height_cm", e.target.value)}
        />
        <Input
          label="Weight (kg)"
          placeholder="In kilograms"
          type="number"
          value={form.weight_kg}
          onChange={(e) => update("weight_kg", e.target.value)}
        />
        <Input
          label="Birthplace"
          placeholder="Ex. (City, Province)"
          value={form.birthplace}
          onChange={(e) => update("birthplace", e.target.value)}
        />
        <Input
          label="Contact Number"
          placeholder="Enter Contact Number"
          value={form.contact_number}
          onChange={(e) => update("contact_number", e.target.value)}
        />
      </div>

      {/* Row 4 — Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="House/Unit/Street"
          placeholder="Enter Location"
          value={form.house_street}
          onChange={(e) => update("house_street", e.target.value)}
        />
        <Select
          label="Town"
          options={TOWN_OPTIONS}
          value={form.town}
          onChange={(e) => update("town", e.target.value)}
        />
        <Select
          label="Barangay"
          options={MARIVELES_BARANGAYS}
          value={form.barangay}
          onChange={(e) => update("barangay", e.target.value)}
        />
      </div>
    </div>
  );
}

/* ── Parents / Guardian ── */
function ParentsTab({ form, update }: TabProps) {
  return (
    <div className="space-y-8">
      {/* Father */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Father&rsquo;s Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Full Name"
            placeholder="Enter Father's Full Name"
            value={form.father_name}
            onChange={(e) => update("father_name", e.target.value)}
          />
          <Input
            label="Occupation"
            placeholder="Enter Father's Occupation"
            value={form.father_occupation}
            onChange={(e) => update("father_occupation", e.target.value)}
          />
          <Input
            label="Contact Number"
            placeholder="Enter Contact Number"
            value={form.father_contact}
            onChange={(e) => update("father_contact", e.target.value)}
          />
        </div>
      </div>

      {/* Mother */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Mother&rsquo;s Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Full Name"
            placeholder="Enter Mother's Full Name"
            value={form.mother_name}
            onChange={(e) => update("mother_name", e.target.value)}
          />
          <Input
            label="Occupation"
            placeholder="Enter Mother's Occupation"
            value={form.mother_occupation}
            onChange={(e) => update("mother_occupation", e.target.value)}
          />
          <Input
            label="Contact Number"
            placeholder="Enter Contact Number"
            value={form.mother_contact}
            onChange={(e) => update("mother_contact", e.target.value)}
          />
        </div>
      </div>

      {/* Guardian */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Guardian&rsquo;s Information (if applicable)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Full Name"
            placeholder="Enter Guardian's Full Name"
            value={form.guardian_name}
            onChange={(e) => update("guardian_name", e.target.value)}
          />
          <Input
            label="Relationship"
            placeholder="Enter Relationship"
            value={form.guardian_relation}
            onChange={(e) => update("guardian_relation", e.target.value)}
          />
          <Input
            label="Contact Number"
            placeholder="Enter Contact Number"
            value={form.guardian_contact}
            onChange={(e) => update("guardian_contact", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Education ── */
function EducationTab({ form, update }: TabProps) {
  return (
    <div className="space-y-8">
      {/* Primary */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Primary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Name of School"
            placeholder="Enter Primary School Name"
            value={form.primary_school}
            onChange={(e) => update("primary_school", e.target.value)}
          />
          <Input
            label="Address"
            placeholder="Enter School Address"
            value={form.primary_address}
            onChange={(e) => update("primary_address", e.target.value)}
          />
          <Input
            label="Year Graduated"
            placeholder="e.g. 2018"
            type="number"
            value={form.primary_year_graduated}
            onChange={(e) => update("primary_year_graduated", e.target.value)}
          />
        </div>
      </div>

      {/* Secondary — JHS */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Junior High School (JHS)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Name of School"
            placeholder="Enter JHS School Name"
            value={form.jhs_school}
            onChange={(e) => update("jhs_school", e.target.value)}
          />
          <Input
            label="Address"
            placeholder="Enter School Address"
            value={form.jhs_address}
            onChange={(e) => update("jhs_address", e.target.value)}
          />
          <Input
            label="Year Graduated"
            placeholder="e.g. 2020"
            type="number"
            value={form.jhs_year_graduated}
            onChange={(e) => update("jhs_year_graduated", e.target.value)}
          />
        </div>
      </div>

      {/* Secondary — SHS */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">
          Senior High School (SHS)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Name of School"
            placeholder="Enter SHS School Name"
            value={form.shs_school}
            onChange={(e) => update("shs_school", e.target.value)}
          />
          <Input
            label="Address"
            placeholder="Enter School Address"
            value={form.shs_address}
            onChange={(e) => update("shs_address", e.target.value)}
          />
          <Input
            label="Year Graduated"
            placeholder="e.g. 2022"
            type="number"
            value={form.shs_year_graduated}
            onChange={(e) => update("shs_year_graduated", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Others ── */
function OthersTab({ form, update }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-1.5">
            Skills
          </label>
          <textarea
            className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-body text-foreground
              transition-all duration-200 focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
              min-h-[100px] resize-y"
            placeholder="List your skills (e.g. Leadership, Communication, etc.)"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-1.5">
            Hobbies
          </label>
          <textarea
            className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-body text-foreground
              transition-all duration-200 focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
              min-h-[100px] resize-y"
            placeholder="List your hobbies (e.g. Reading, Sports, Music)"
            value={form.hobbies}
            onChange={(e) => update("hobbies", e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-1.5">
            Organizations
          </label>
          <textarea
            className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-body text-foreground
              transition-all duration-200 focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
              min-h-[100px] resize-y"
            placeholder="List organizations you're a member of"
            value={form.organizations}
            onChange={(e) => update("organizations", e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-body font-medium text-foreground mb-1.5">
            Awards & Achievements
          </label>
          <textarea
            className="w-full bg-input-bg border-2 border-input-border rounded-xl px-4 py-3 font-body text-foreground
              transition-all duration-200 focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
              min-h-[100px] resize-y"
            placeholder="List any awards or achievements"
            value={form.awards}
            onChange={(e) => update("awards", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
