-- ============================================================
--  Migration: Drop unused columns from applicants & applications
--  Run this after backing up your database!
-- ============================================================

USE scholarship_system;

-- Drop columns from applicants table
ALTER TABLE applicants
  DROP COLUMN IF EXISTS student_number,
  DROP COLUMN IF EXISTS gpa,
  DROP COLUMN IF EXISTS year_level,
  DROP COLUMN IF EXISTS course,
  DROP COLUMN IF EXISTS college,
  DROP COLUMN IF EXISTS monthly_income,
  DROP COLUMN IF EXISTS household_size;

-- Drop gpa_at_submission from applications table
ALTER TABLE applications
  DROP COLUMN IF EXISTS gpa_at_submission;
