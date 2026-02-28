/**
 * database/types.ts
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
  student_number: string;
  date_of_birth: Date;
  contact_number: string | null;
  address: string | null;
  gpa: number;
  year_level: number;
  course: string;
  college: string;
  monthly_income: number;
  household_size: number;
  created_at: Date;
  updated_at: Date;
}

export interface ScholarshipRow {
  id: number;
  name: string;
  description: string | null;
  grantor: string;
  min_gpa: number;
  max_monthly_income: number | null;
  max_year_level: number | null;
  slots_available: number;
  slots_total: number;
  application_open: Date;
  application_close: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationRow {
  id: number;
  applicant_id: number;
  scholarship_id: number;
  status: ApplicationStatus;
  gpa_at_submission: number | null;
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
  gpa_met: boolean;
  income_met: boolean;
  documents_complete: boolean;
  enrollment_verified: boolean;
}

// ─── API request / response shapes ──────────────────────────────────────────

/** POST /api/applications — request body */
export interface CreateApplicationBody {
  scholarship_id: number;
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
  scholarship_id?: number;
  /** page number (1-based) */
  page?: number;
  /** rows per page, default 20 */
  limit?: number;
}

/** Enriched application row returned to clients */
export interface ApplicationWithDetails extends ApplicationRow {
  applicant_name: string;
  student_number: string;
  scholarship_name: string;
  grantor: string;
}

// ─── Eligibility result ──────────────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  checks: {
    gpa: boolean;
    income: boolean;
    year_level: boolean;
    open_period: boolean;
    slots_available: boolean;
  };
}
