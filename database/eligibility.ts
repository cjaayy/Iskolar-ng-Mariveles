import type { ApplicantRow, EligibilityResult } from "./types";

export function checkEligibility(_applicant: ApplicantRow): EligibilityResult {
  const reasons: string[] = [];

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export type RequiredDocument =
  | "transcript"
  | "income_cert"
  | "id"
  | "endorsement";

export const REQUIRED_DOCUMENT_TYPES: RequiredDocument[] = [
  "transcript",
  "income_cert",
  "id",
];

export function getMissingDocuments(
  submitted: Array<{ type: string }>,
  required: RequiredDocument[] = REQUIRED_DOCUMENT_TYPES,
): RequiredDocument[] {
  const submittedTypes = new Set(submitted.map((d) => d.type));
  return required.filter((r) => !submittedTypes.has(r));
}

export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s.,;:\-()ñÑáéíóúÁÉÍÓÚ]/gi, "")
    .trim()
    .slice(0, 2000);
}
