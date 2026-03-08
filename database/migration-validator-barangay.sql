USE scholarship_system;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_barangay VARCHAR(100) NULL DEFAULT NULL
    COMMENT 'Barangay assigned to this validator (NULL for admin/applicant)';
