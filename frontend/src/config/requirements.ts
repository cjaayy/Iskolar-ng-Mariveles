/**
 * src/config/requirements.ts
 * Static definition of all Iskolar ng Mariveles scholarship document requirements.
 * The API merges this with per-application submission statuses from the DB.
 *
 * Deadline: On or before June 30, 2025.
 * Submission Location: Office of the Municipal Administrator, 2nd Floor,
 *   Municipality of Mariveles, Monday–Friday 8:00 AM – 5:00 PM.
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

/** Submission deadline for all requirements (SY 2025-2026 cycle) */
export const SUBMISSION_DEADLINE = "2025-06-30";
export const SUBMISSION_LOCATION =
  "Office of the Municipal Administrator, 2nd Floor, Municipality of Mariveles";
export const SUBMISSION_HOURS = "Monday–Friday, 8:00 AM – 5:00 PM";

export const REQUIREMENT_CONFIGS: RequirementConfig[] = [
  // ─── Personal Documents ────────────────────────────────────────
  {
    key: "application_form",
    name: "Accomplished Application Form",
    description:
      "Fully accomplished scholarship application form with complete and accurate information.",
    group: "personal",
    helpTip:
      "Download the official application form, fill out all fields legibly, and sign it before uploading.",
    sampleUrl: "#",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "letter_of_intent",
    name: "Letter of Intent",
    description:
      "A letter stating your intent to apply for the Iskolar ng Mariveles scholarship program.",
    group: "personal",
    helpTip:
      "Address the letter to the Municipal Mayor of Mariveles. Include your full name, course, school, year level, and reason for applying.",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "id_photo",
    name: "2x2 ID Photos",
    description:
      "Two (2) pieces of recent 2x2 colored ID photographs with white background.",
    group: "personal",
    helpTip:
      "Must be taken within the last 6 months. White background, formal attire. Upload a scanned copy of both photos.",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "birth_certificate",
    name: "Birth Certificate",
    description: "Photocopy of your PSA-issued birth certificate.",
    group: "personal",
    helpTip:
      "Must be PSA-issued (not local civil registrar). A clear photocopy is acceptable. Order online at PSA Serbilis if needed.",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "comelec_parents",
    name: "COMELEC ID / Registration (Parents)",
    description:
      "Photocopy of COMELEC Voter's ID, Registration Record, or Certification of Registration of both parents — proving residency in Mariveles, Bataan.",
    group: "personal",
    helpTip:
      "Both parents must have COMELEC proof of registration in Mariveles/Bataan. Acceptable documents: Voter's ID, Voter's Registration Record, or COMELEC Certification. Upload copies for both parents in a single file or separately.",
    dueDate: SUBMISSION_DEADLINE,
  },

  // ─── Academic Records ──────────────────────────────────────────
  {
    key: "report_card",
    name: "Report Card (Form 138)",
    description:
      "Certified True Copy of Report Card (Form 138) with a minimum general average of 80%. Required for incoming freshmen.",
    group: "academic",
    helpTip:
      "Request a Certified True Copy from your school registrar. Must show a general average of at least 80%. The copy must be stamped with the school seal and signed by the principal.",
    sampleUrl: "#",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "school_card",
    name: "Validated School Card (SY 2024-2025)",
    description:
      "Photocopy of your validated school card for SY 2024-2025, stamped with the school seal and signed by the principal. Required for renewal (Elementary, JHS, and SHS).",
    group: "academic",
    helpTip:
      "Ensure the school card is stamped with the school seal and signed by the principal. For Junior & Senior High School students, this must be submitted along with the Certificate of Enrollment.",
    sampleUrl: "#",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "enrollment_cert",
    name: "Certificate of Enrollment",
    description:
      "Certificate of Enrollment from your current school for SY 2025-2026. Required for Junior & Senior High School renewal applicants.",
    group: "academic",
    helpTip:
      "Request this from your school's registrar office. Usually ready within 2–3 business days. Required alongside the validated school card for JHS/SHS renewal.",
    sampleUrl: "#",
    dueDate: SUBMISSION_DEADLINE,
  },
];

export const REQUIREMENT_MAP = Object.fromEntries(
  REQUIREMENT_CONFIGS.map((c) => [c.key, c]),
);
