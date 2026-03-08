USE scholarship_system;

ALTER TABLE applicants
  DROP COLUMN IF EXISTS student_number,
  DROP COLUMN IF EXISTS gpa,
  DROP COLUMN IF EXISTS year_level,
  DROP COLUMN IF EXISTS course,
  DROP COLUMN IF EXISTS college,
  DROP COLUMN IF EXISTS monthly_income,
  DROP COLUMN IF EXISTS household_size;

ALTER TABLE applications
  DROP COLUMN IF EXISTS gpa_at_submission;
