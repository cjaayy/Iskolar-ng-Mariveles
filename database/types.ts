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

export type RequirementSubmissionStatus =
  | "missing"
  | "in_progress"
  | "pending"
  | "approved"
  | "rejected";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  assigned_barangay: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantRow {
  id: number;
  user_id: number;
  date_of_birth: string | null;
  contact_number: string | null;
  address: string | null;
  gender: string | null;
  blood_type: string | null;
  civil_status: string | null;
  maiden_name: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  religion: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birthplace: string | null;
  house_street: string | null;
  town: string | null;
  barangay: string | null;
  father_name: string | null;
  father_occupation: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  mother_contact: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  primary_school: string | null;
  primary_address: string | null;
  primary_year_graduated: number | null;
  secondary_school: string | null;
  secondary_address: string | null;
  secondary_year_graduated: number | null;
  tertiary_school: string | null;
  tertiary_address: string | null;
  tertiary_year_graduated: number | null;
  tertiary_program: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: number;
  applicant_id: number;
  status: ApplicationStatus;
  income_at_submission: number | null;
  documents: DocumentEntry[] | null;
  remarks: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationRow {
  id: number;
  application_id: number;
  validator_id: number;
  action: ValidationAction;
  checklist: ValidationChecklist | null;
  notes: string | null;
  created_at: string;
}

export interface RequirementSubmissionRow {
  id: number;
  application_id: number;
  requirement_key: string;
  status: RequirementSubmissionStatus;
  progress: number;
  file_name: string | null;
  file_url: string | null;
  uploaded_at: string | null;
  notes: string | null;
  validated_by: number | null;
  validated_at: string | null;
  validator_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationLinkRow {
  id: number;
  token: string;
  label: string | null;
  max_uses: number;
  times_used: number;
  expires_at: string | null;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarangayAccessRow {
  id: number;
  barangay: string;
  is_open: boolean;
  submission_open_date: string | null;
  submission_close_date: string | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentEntry {
  type: "transcript" | "income_cert" | "id" | "endorsement" | "other";
  label: string;
  path: string;
  uploaded_at: string;
}

export interface ValidationChecklist {
  documents_complete: boolean;
  enrollment_verified: boolean;
}

export interface CreateApplicationBody {}

export interface UpdateValidationBody {
  application_id: number;
  action: ValidationAction;
  checklist?: ValidationChecklist;
  notes?: string;
}

export interface GetApplicationsQuery {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}

export interface ApplicationWithDetails extends ApplicationRow {
  applicant_name: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
