/**
 * src/db/requirements-config.ts
 * Static definition of all scholarship document requirements.
 * The API merges this with per-application submission statuses from the DB.
 */

export type RequirementGroup = "personal" | "academic" | "financial";

export interface RequirementConfig {
  key: string;
  name: string;
  description: string;
  group: RequirementGroup;
  helpTip: string;
  sampleUrl?: string;
  /** ISO date string — same for all applicants in a cycle */
  dueDate: string;
}

export const REQUIREMENT_CONFIGS: RequirementConfig[] = [
  // ─── Academic ──────────────────────────────────────────────────
  {
    key: "enrollment_cert",
    name: "Enrollment Certificate",
    description:
      "Official certificate from the registrar confirming current enrollment status.",
    group: "academic",
    helpTip:
      "Request this from your school's registrar office. Usually ready within 2–3 business days.",
    sampleUrl: "#",
    dueDate: "2026-03-10",
  },
  {
    key: "certificate_of_grades",
    name: "Certificate of Grades",
    description:
      "Official transcript or grade report for the most recent semester.",
    group: "academic",
    helpTip:
      "Must show all subjects for the current semester with your general weighted average.",
    sampleUrl: "#",
    dueDate: "2026-03-15",
  },

  // ─── Financial ──────────────────────────────────────────────────
  {
    key: "income_tax_return",
    name: "Income Tax Return (ITR)",
    description: "Parent or guardian's latest ITR or Certificate of No Income.",
    group: "financial",
    helpTip:
      "If your parent/guardian has no income, submit a notarized Certificate of No Income instead.",
    sampleUrl: "#",
    dueDate: "2026-03-20",
  },

  // ─── Personal ──────────────────────────────────────────────────
  {
    key: "barangay_certificate",
    name: "Barangay Certificate",
    description: "Certificate of residency from your local barangay hall.",
    group: "personal",
    helpTip:
      "Visit your barangay hall with a valid ID. The certificate is usually free or minimal cost.",
    sampleUrl: "#",
    dueDate: "2026-03-25",
  },
  {
    key: "community_service_log",
    name: "Community Service Log",
    description: "Completed community service hours with supervisor sign-off.",
    group: "personal",
    helpTip:
      "Log at least 20 hours of community service. Each entry needs a supervisor signature.",
    dueDate: "2026-04-01",
  },
  {
    key: "id_photo",
    name: "2x2 ID Photo",
    description: "Recent 2x2 ID photo with white background.",
    group: "personal",
    helpTip:
      "Must be taken within the last 6 months. White background, formal attire.",
    dueDate: "2026-03-10",
  },
  {
    key: "birth_certificate",
    name: "Birth Certificate (PSA)",
    description: "PSA-issued birth certificate. Photocopy is acceptable.",
    group: "personal",
    helpTip:
      "Must be PSA-issued (not local civil registrar). Order online at PSA Serbilis if needed.",
    dueDate: "2026-03-10",
  },
  {
    key: "guardian_consent",
    name: "Parent/Guardian Consent",
    description: "Signed consent form from parent or legal guardian.",
    group: "personal",
    helpTip:
      "Download the consent form template, have it signed and notarized.",
    sampleUrl: "#",
    dueDate: "2026-03-30",
  },
];

export const REQUIREMENT_MAP = Object.fromEntries(
  REQUIREMENT_CONFIGS.map((c) => [c.key, c]),
);
