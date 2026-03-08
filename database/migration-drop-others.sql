ALTER TABLE applicants
  DROP COLUMN IF EXISTS skills,
  DROP COLUMN IF EXISTS hobbies,
  DROP COLUMN IF EXISTS organizations,
  DROP COLUMN IF EXISTS awards;
