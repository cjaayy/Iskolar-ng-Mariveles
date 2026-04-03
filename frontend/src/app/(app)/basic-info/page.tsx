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

const SUB_TABS = ["Personal Information", "Parents", "Education"] as const;
type SubTab = (typeof SUB_TABS)[number];

interface BasicInfoForm {
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
  father_name: string;
  father_occupation: string;
  father_contact: string;
  mother_name: string;
  mother_occupation: string;
  mother_contact: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_contact: string;
  current_school: string;
  year_level: string;
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
  current_school: "",
  year_level: "",
};

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
].map((b) => ({ label: b, value: b }));

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function BasicInfoPage() {
  const { loading: sessionLoading } = useSession();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<SubTab>("Personal Information");
  const [form, setForm] = useState<BasicInfoForm>(emptyForm);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        current_school: data.current_school ?? "",
        year_level: data.year_level ?? "",
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

  const update = (field: keyof BasicInfoForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (payload.height_cm) payload.height_cm = Number(payload.height_cm);
      if (payload.weight_kg) payload.weight_kg = Number(payload.weight_kg);

      // Don't update current_school and year_level - they're read-only from registration
      delete payload.current_school;
      delete payload.year_level;

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

  const handlePrevious = () => {
    const currentIndex = SUB_TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(SUB_TABS[currentIndex - 1]);
      setTimeout(scrollToTop, 50);
    }
  };

  const isFirstTab = activeTab === SUB_TABS[0];
  const isLastTab = activeTab === SUB_TABS[SUB_TABS.length - 1];

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
      <motion.div variants={fadeUp}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Basic Information" },
          ]}
        />
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="font-heading text-2xl md:text-3xl font-bold text-foreground"
      >
        Basic Information
      </motion.h1>

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
              {saving ? "Saving\u2026" : isLastTab ? "Save" : "Save & Next"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface TabProps {
  form: BasicInfoForm;
  update: (field: keyof BasicInfoForm, value: string) => void;
}

function PersonalInfoTab({ form, update }: TabProps) {
  const isSingle = form.civil_status === "Single";
  const isWidowedSeparatedAnnulled = [
    "Widowed",
    "Separated",
    "Annulled",
  ].includes(form.civil_status);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Street / Purok / Sitio (optional)"
          placeholder="e.g. Purok 3, Sampaguita St."
          value={form.house_street}
          onChange={(e) => update("house_street", e.target.value)}
        />
        <Select
          label="Barangay (Mariveles, Bataan)"
          options={MARIVELES_BARANGAYS}
          value={form.barangay}
          onChange={(e) => update("barangay", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Town"
          value="Mariveles"
          disabled
          className="bg-muted/50"
        />
        <Input
          label="Province"
          value="Bataan"
          disabled
          className="bg-muted/50"
        />
      </div>
    </div>
  );
}

function ParentsTab({ form, update }: TabProps) {
  return (
    <div className="space-y-8">
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

function EducationTab({ form }: TabProps) {
  return (
    <div className="space-y-8">
      {/* Current School from Registration - Read Only */}
      {form.current_school ? (
        <div className="p-4 rounded-xl bg-ocean-50 dark:bg-ocean-500/10 border border-ocean-200 dark:border-ocean-500/20">
          <h3 className="font-heading text-base font-semibold text-ocean-700 dark:text-ocean-400 mb-3">
            Registered School
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current School"
              value={form.current_school}
              disabled
              className="bg-white/50 dark:bg-white/5"
            />
            <Input
              label="Year Level"
              value={form.year_level}
              disabled
              className="bg-white/50 dark:bg-white/5"
            />
          </div>
          <p className="text-xs text-muted-fg mt-3">
            This information was provided during your registration.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No school information was provided during registration.
          </p>
        </div>
      )}
    </div>
  );
}
