-- Migration: Add education level and description to registration_links
-- Date: 2026-04-02

-- Create the education_level enum type (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level') THEN
        CREATE TYPE education_level AS ENUM ('elementary', 'high_school', 'senior_high');
    END IF;
END $$;

-- Add new columns to registration_links table (if not exist)
ALTER TABLE registration_links
ADD COLUMN IF NOT EXISTS education_level education_level NOT NULL DEFAULT 'senior_high',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for filtering by education level (if not exists)
CREATE INDEX IF NOT EXISTS idx_reg_links_education_level ON registration_links (education_level);

-- Update the comment for the table
COMMENT ON COLUMN registration_links.education_level IS 'Education level category: elementary, high_school, or senior_high';
COMMENT ON COLUMN registration_links.description IS 'Optional description for the registration link';
