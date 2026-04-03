-- Migration: Replace school addresses and year graduated with year level
-- Date: 2026-04-03

-- Add new year level columns
ALTER TABLE applicants
ADD COLUMN IF NOT EXISTS primary_year_level TEXT,
ADD COLUMN IF NOT EXISTS secondary_year_level TEXT,
ADD COLUMN IF NOT EXISTS tertiary_year_level TEXT;

-- Add comments
COMMENT ON COLUMN applicants.primary_year_level IS 'Year level for primary school (Grade 1-6)';
COMMENT ON COLUMN applicants.secondary_year_level IS 'Year level for junior high school (Grade 7-10)';
COMMENT ON COLUMN applicants.tertiary_year_level IS 'Year level for senior high school (Grade 11-12)';

-- Optional: Drop old columns if you want to remove them completely
-- Uncomment these lines after confirming migration is successful
-- ALTER TABLE applicants DROP COLUMN IF EXISTS primary_address;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS primary_year_graduated;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS secondary_address;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS secondary_year_graduated;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS tertiary_address;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS tertiary_year_graduated;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS tertiary_program;
