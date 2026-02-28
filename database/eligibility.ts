/**
 * src/db/eligibility.ts
 * Pure-function eligibility checks — no DB calls, easy to unit-test.
 */
import type { ApplicantRow, ScholarshipRow, EligibilityResult } from "./types";

/**
 * Returns whether an applicant meets all criteria for a scholarship,
 * plus human-readable failure reasons.
 */
export function checkEligibility(
  applicant: ApplicantRow,
  scholarship: ScholarshipRow,
): EligibilityResult {
  const reasons: string[] = [];
  const now = new Date();

  // 1. GPA check
  const gpaOk = applicant.gpa >= scholarship.min_gpa;
  if (!gpaOk) {
    reasons.push(
      `GPA ${applicant.gpa.toFixed(2)} is below the required minimum of ${scholarship.min_gpa.toFixed(2)}`,
    );
  }

  // 2. Income check (null max = no cap)
  const incomeOk =
    scholarship.max_monthly_income === null ||
    applicant.monthly_income <= scholarship.max_monthly_income;
  if (!incomeOk) {
    reasons.push(
      `Monthly family income ₱${applicant.monthly_income.toLocaleString()} exceeds the cap of ₱${scholarship.max_monthly_income!.toLocaleString()}`,
    );
  }

  // 3. Year level check (null max = all year levels)
  const yearLevelOk =
    scholarship.max_year_level === null ||
    applicant.year_level <= scholarship.max_year_level;
  if (!yearLevelOk) {
    reasons.push(
      `Year level ${applicant.year_level} exceeds the maximum allowed year level of ${scholarship.max_year_level}`,
    );
  }

  // 4. Application period open?
  const openDate = new Date(scholarship.application_open);
  const closeDate = new Date(scholarship.application_close);
  closeDate.setHours(23, 59, 59, 999); // inclusive end-of-day
  const periodOk = now >= openDate && now <= closeDate;
  if (!periodOk) {
    reasons.push(
      `Application period is ${now < openDate ? "not yet open" : "already closed"}`,
    );
  }

  // 5. Slots available
  const slotsOk = scholarship.slots_available > 0;
  if (!slotsOk) {
    reasons.push("No available slots remaining for this scholarship");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    checks: {
      gpa: gpaOk,
      income: incomeOk,
      year_level: yearLevelOk,
      open_period: periodOk,
      slots_available: slotsOk,
    },
  };
}

// ─── Document completeness ────────────────────────────────────────────────────

export type RequiredDocument =
  | "transcript"
  | "income_cert"
  | "id"
  | "endorsement";

/** Minimum required document types for standard applications */
export const REQUIRED_DOCUMENT_TYPES: RequiredDocument[] = [
  "transcript",
  "income_cert",
  "id",
];

/**
 * Returns missing document types from an applicant's submitted document list.
 */
export function getMissingDocuments(
  submitted: Array<{ type: string }>,
  required: RequiredDocument[] = REQUIRED_DOCUMENT_TYPES,
): RequiredDocument[] {
  const submittedTypes = new Set(submitted.map((d) => d.type));
  return required.filter((r) => !submittedTypes.has(r));
}

// ─── Sanitisation helpers ─────────────────────────────────────────────────────

/**
 * Strip HTML tags and trim whitespace from a user-supplied string.
 * Use this before inserting any free-text field into the database.
 */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip HTML
    .replace(/[^\w\s.,;:\-()ñÑáéíóúÁÉÍÓÚ]/gi, "") // allow common PH chars
    .trim()
    .slice(0, 2000); // hard length cap
}
