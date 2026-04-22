export type RequirementGroup = "personal" | "academic" | "financial";

export interface RequirementConfig {
  key: string;
  name: string;
  description: string;
  group: RequirementGroup;
  helpTip: string;
  sampleUrl?: string;
  dueDate: string;
}

export const SUBMISSION_DEADLINE = "2025-06-30";
export const SUBMISSION_LOCATION =
  "Office of the Municipal Administrator, 2nd Floor, Municipality of Mariveles";
export const SUBMISSION_HOURS = "Monday–Friday, 8:00 AM – 5:00 PM";

export const REQUIREMENT_CONFIGS: RequirementConfig[] = [
  {
    key: "barangay_indigency",
    name: "Barangay Indigency Certificate",
    description:
      "Certificate of indigency issued by your barangay to confirm residency and financial need.",
    group: "financial",
    helpTip:
      "Request this from your barangay hall. Ensure it is signed and stamped before uploading.",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "grades_card",
    name: "Grades Card (Elem, JHS, SHS)",
    description:
      "Grades card for the current school year (Elementary, JHS, or SHS).",
    group: "academic",
    helpTip:
      "Secure this from your school registrar or adviser. Make sure the document is signed or stamped.",
    dueDate: SUBMISSION_DEADLINE,
  },
  {
    key: "enrollment_cert",
    name: "Certificate of Enrollment",
    description: "Certificate of enrollment for the current school year.",
    group: "academic",
    helpTip:
      "Request this from your school registrar office. Ensure it is signed or stamped.",
    dueDate: SUBMISSION_DEADLINE,
  },
];

export const REQUIREMENT_MAP = Object.fromEntries(
  REQUIREMENT_CONFIGS.map((c) => [c.key, c]),
);
