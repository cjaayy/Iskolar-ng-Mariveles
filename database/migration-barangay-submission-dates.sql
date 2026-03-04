-- ============================================================
--  Migration: Add submission date window to barangay_access
--  Each barangay can have a scheduled date window for when
--  applicants may submit requirements.
-- ============================================================

USE scholarship_system;

ALTER TABLE barangay_access
  ADD COLUMN IF NOT EXISTS submission_open_date  DATE NULL DEFAULT NULL
    COMMENT 'Date from which requirement submission is allowed (inclusive)',
  ADD COLUMN IF NOT EXISTS submission_close_date DATE NULL DEFAULT NULL
    COMMENT 'Last date for requirement submission (inclusive)';
