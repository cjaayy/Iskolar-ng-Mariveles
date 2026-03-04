-- ============================================================
--  Migration: Add assigned_barangay to users table
--  Validators are assigned to a single barangay
-- ============================================================

USE scholarship_system;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_barangay VARCHAR(100) NULL DEFAULT NULL
    COMMENT 'Barangay assigned to this validator (NULL for admin/applicant)';

