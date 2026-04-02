-- Migration: Add current school and year level to applicants
-- Date: 2026-04-02

-- Add new columns to applicants table for registration
ALTER TABLE applicants
ADD COLUMN current_school VARCHAR(255),
ADD COLUMN year_level VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN applicants.current_school IS 'Current school the applicant is attending';
COMMENT ON COLUMN applicants.year_level IS 'Current year/grade level of the applicant';
