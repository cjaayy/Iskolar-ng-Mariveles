-- Migration: Create approved applicants view
-- Date: 2026-04-12

CREATE OR REPLACE VIEW approved_applicants AS
WITH approved_counts AS (
  SELECT
    application_id,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_requirements
  FROM requirement_submissions
  GROUP BY application_id
)
SELECT
  a.id AS application_id,
  ap.id AS applicant_id,
  u.full_name AS applicant_name,
  u.email,
  ap.barangay,
  ap.contact_number,
  a.submitted_at,
  COALESCE(ac.approved_requirements, 0) AS approved_requirements,
  8 AS total_requirements
FROM applications a
JOIN applicants ap ON ap.id = a.applicant_id
JOIN users u ON u.id = ap.user_id
LEFT JOIN approved_counts ac ON ac.application_id = a.id
WHERE a.status <> 'draft'
  AND COALESCE(ac.approved_requirements, 0) = 8;
