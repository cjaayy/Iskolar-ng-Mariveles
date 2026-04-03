-- filepath: c:\Users\mjhay\Desktop\Programming\Visual Studio Code\Projects\Iskolar ng Mariveles\database\migration-school-access.sql
-- Migration: Convert barangay-based access control to school-based
-- Date: 2026-04-02

-- 1. Create school_access table (replaces barangay_access for school-based control)
CREATE TABLE school_access (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_name           VARCHAR(255) NOT NULL UNIQUE,
  education_level       education_level NOT NULL,
  is_open               BOOLEAN      NOT NULL DEFAULT false,
  submission_open_date  DATE,
  submission_close_date DATE,
  updated_by            INT          REFERENCES users (id),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_school_access_level ON school_access (education_level);
CREATE INDEX idx_school_access_open ON school_access (is_open);

-- Enable RLS
ALTER TABLE school_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to school_access"
  ON public.school_access FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Deny write access to school_access"
  ON public.school_access FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny update access to school_access"
  ON public.school_access FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny delete access to school_access"
  ON public.school_access FOR DELETE TO anon, authenticated
  USING (false);

-- Create trigger for updated_at
CREATE TRIGGER trg_school_access_updated_at
  BEFORE UPDATE ON school_access FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Update users table: add assigned_school column (replaces assigned_barangay for validators)
ALTER TABLE users 
ADD COLUMN assigned_school VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN users.assigned_school IS 'School assigned to validator for filtering applicants';

-- 3. Insert all schools (Public Elementary Schools)
INSERT INTO school_access (school_name, education_level) VALUES
  ('A.G. Llamas Elementary School', 'elementary'),
  ('Alasasin Elementary School', 'elementary'),
  ('Balon Elementary School', 'elementary'),
  ('Baseco Elementary School', 'elementary'),
  ('Batangas II Elementary School', 'elementary'),
  ('Bayview Elementary School', 'elementary'),
  ('Bepz Elementary School', 'elementary'),
  ('Biaan Aeta School', 'elementary'),
  ('Cabcaben Elementary School', 'elementary'),
  ('Gonzales Elementary School', 'elementary'),
  ('Ipag Elementary School', 'elementary'),
  ('Lucanin Elementary School', 'elementary'),
  ('Marina Bay Elementary School', 'elementary'),
  ('Mountain View Elementary School', 'elementary'),
  ('New Alion Elementary School', 'elementary'),
  ('Old Alion Elementary School', 'elementary'),
  ('Renato L. Cayetano Memorial School', 'elementary'),
  ('San Isidro Primary School', 'elementary'),
  ('Sisiman Elementary School', 'elementary'),
  ('Sto. Niño Biaan Elementary School', 'elementary'),
  ('Townsite Elementary School', 'elementary');

-- Insert Public Junior & Senior High Schools
INSERT INTO school_access (school_name, education_level) VALUES
  ('MNHS - Poblacion', 'high_school'),
  ('MNHS - Alasasin', 'high_school'),
  ('MNHS - Alion', 'high_school'),
  ('MNHS - Baseco', 'high_school'),
  ('MNHS - Batangas II', 'high_school'),
  ('MNHS - Cabcaben', 'high_school'),
  ('MNHS - Malaya', 'high_school'),
  ('Ipag National High School', 'high_school'),
  ('Lamao National High School', 'high_school'),
  ('Biaan Integrated School', 'high_school');

-- Insert Senior High Schools (public and specialized)
INSERT INTO school_access (school_name, education_level) VALUES
  ('MNHS - Camaya Campus', 'senior_high'),
  ('Mariveles Senior High School - Sitio Mabuhay', 'senior_high');

-- Insert Private Schools (K-12)
-- These are listed under all levels since they offer K-12
INSERT INTO school_access (school_name, education_level) VALUES
  -- Elementary level private schools
  ('Sunny Hillside School of Bataan, Inc.', 'elementary'),
  ('Saint Nicholas Catholic School of Mariveles', 'elementary'),
  ('Santa Mariana De Jesus Academy, Inc.', 'elementary'),
  ('Bataan GN Christian School, Inc.', 'elementary'),
  ('Christian Community School of Mariveles, Inc.', 'elementary'),
  ('Blessed Regina Protmann Catholic School', 'elementary'),
  ('BEPZ Multinational School, Inc.', 'elementary');

-- High school level private schools
INSERT INTO school_access (school_name, education_level) VALUES
  ('Sunny Hillside School of Bataan, Inc. - JHS', 'high_school'),
  ('Saint Nicholas Catholic School of Mariveles - JHS', 'high_school'),
  ('Santa Mariana De Jesus Academy, Inc. - JHS', 'high_school'),
  ('Bataan GN Christian School, Inc. - JHS', 'high_school'),
  ('Christian Community School of Mariveles, Inc. - JHS', 'high_school'),
  ('Blessed Regina Protmann Catholic School - JHS', 'high_school'),
  ('BEPZ Multinational School, Inc. - JHS', 'high_school');

-- Senior high level private schools
INSERT INTO school_access (school_name, education_level) VALUES
  ('Sunny Hillside School of Bataan, Inc. - SHS', 'senior_high'),
  ('Saint Nicholas Catholic School of Mariveles - SHS', 'senior_high'),
  ('Santa Mariana De Jesus Academy, Inc. - SHS', 'senior_high'),
  ('Bataan GN Christian School, Inc. - SHS', 'senior_high'),
  ('Christian Community School of Mariveles, Inc. - SHS', 'senior_high'),
  ('Softnet Information Technology Center', 'senior_high'),
  ('Blessed Regina Protmann Catholic School - SHS', 'senior_high'),
  ('BEPZ Multinational School, Inc. - SHS', 'senior_high');

-- Add "Other" entry for each level (for custom schools)
INSERT INTO school_access (school_name, education_level) VALUES
  ('Other (Elementary)', 'elementary'),
  ('Other (High School)', 'high_school'),
  ('Other (Senior High)', 'senior_high');

-- Add comments
COMMENT ON TABLE school_access IS 'Controls which schools can have applicants log in and submit requirements';
COMMENT ON COLUMN school_access.school_name IS 'Name of the school';
COMMENT ON COLUMN school_access.education_level IS 'Education level: elementary, high_school, or senior_high';
COMMENT ON COLUMN school_access.is_open IS 'Whether this school is currently open for submissions';
COMMENT ON COLUMN school_access.submission_open_date IS 'Date when submissions open for this school';
COMMENT ON COLUMN school_access.submission_close_date IS 'Date when submissions close for this school';
