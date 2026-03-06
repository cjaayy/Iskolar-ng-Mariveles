/**
 * src/db/types.ts
 * TypeScript interfaces that mirror the MySQL schema tables.
 * Use these as the single source of truth for DB row shapes.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "validator" | "applicant";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "withdrawn";

export type ValidationAction =
  | "approved"
  | "rejected"
  | "returned"
  | "requested_info";

// ─── Table row shapes ────────────────────────────────────────────────────────

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicantRow {
  id: number;
  user_id: number;
  date_of_birth: Date;
  contact_number: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationRow {
  id: number;
  applicant_id: number;
  status: ApplicationStatus;
  income_at_submission: number | null;
  documents: DocumentEntry[] | null;
  remarks: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ValidationRow {
  id: number;
  application_id: number;
  validator_id: number;
  action: ValidationAction;
  checklist: ValidationChecklist | null;
  notes: string | null;
  created_at: Date;
}

// ─── Domain subtypes ─────────────────────────────────────────────────────────

export interface DocumentEntry {
  type: "transcript" | "income_cert" | "id" | "endorsement" | "other";
  label: string;
  /** Relative URL path or storage key */
  path: string;
  uploaded_at: string; // ISO 8601
}

export interface ValidationChecklist {
  documents_complete: boolean;
  enrollment_verified: boolean;
}

export interface RegistrationLinkRow {
  id: number;
  token: string;
  label: string | null;
  max_uses: number;
  times_used: number;
  expires_at: Date | null;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── API request / response shapes ──────────────────────────────────────────

/** POST /api/applications — request body */
export interface CreateApplicationBody {
  /** applicant_id is resolved from the authenticated session server-side */
}

/** PUT /api/validations — request body */
export interface UpdateValidationBody {
  application_id: number;
  action: ValidationAction;
  checklist?: ValidationChecklist;
  notes?: string;
}

/** GET /api/applications — query params */
export interface GetApplicationsQuery {
  status?: ApplicationStatus;
  /** page number (1-based) */
  page?: number;
  /** rows per page, default 20 */
  limit?: number;
}

/** Enriched application row returned to clients */
export interface ApplicationWithDetails extends ApplicationRow {
  applicant_name: string;
}

// ─── Eligibility result ──────────────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
