/**
 * src/db/eligibility.ts
 * Pure-function eligibility checks — no DB calls, easy to unit-test.
 */
import type { ApplicantRow, EligibilityResult } from "./types";

/**
 * Returns whether an applicant meets all criteria,
 * plus human-readable failure reasons.
 */
export function checkEligibility(_applicant: ApplicantRow): EligibilityResult {
  const reasons: string[] = [];

  // Add eligibility checks here as needed

  return {
    eligible: reasons.length === 0,
    reasons,
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
