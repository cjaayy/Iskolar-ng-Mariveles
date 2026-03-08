CREATE OR REPLACE FUNCTION register_applicant(
  p_token       TEXT,
  p_email       TEXT,
  p_full_name   TEXT,
  p_address     TEXT,
  p_password_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_link_id     INT;
  v_max_uses    INT;
  v_times_used  INT;
  v_expires_at  TIMESTAMPTZ;
  v_user_id     INT;
  v_applicant_id INT;
  v_existing    INT;
BEGIN
  SELECT id, max_uses, times_used, expires_at
    INTO v_link_id, v_max_uses, v_times_used, v_expires_at
    FROM registration_links
   WHERE token = p_token AND is_active = true
   LIMIT 1;

  IF v_link_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid or expired registration link');
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN json_build_object('error', 'This registration link has expired');
  END IF;

  IF v_max_uses > 0 AND v_times_used >= v_max_uses THEN
    RETURN json_build_object('error', 'This registration link has reached its maximum usage');
  END IF;

  SELECT id INTO v_existing FROM users WHERE email = p_email LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('error', 'An account with this email already exists');
  END IF;

  INSERT INTO users (email, password_hash, full_name, role)
  VALUES (p_email, p_password_hash, p_full_name, 'applicant')
  RETURNING id INTO v_user_id;

  INSERT INTO applicants (user_id, address)
  VALUES (v_user_id, p_address)
  RETURNING id INTO v_applicant_id;

  INSERT INTO applications (applicant_id, status)
  VALUES (v_applicant_id, 'submitted');

  UPDATE registration_links
     SET times_used = times_used + 1
   WHERE id = v_link_id;

  RETURN json_build_object(
    'user_id', v_user_id,
    'applicant_id', v_applicant_id,
    'email', p_email
  );
END;
$$;

CREATE OR REPLACE FUNCTION bulk_validate_requirements(
  p_application_id INT,
  p_validator_id   INT,
  p_action         TEXT,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_affected INT;
  v_new_status TEXT;
  v_remarks TEXT;
BEGIN
  UPDATE requirement_submissions
     SET status = p_action::requirement_status,
         validated_by = p_validator_id,
         validated_at = NOW(),
         validator_notes = p_notes
   WHERE application_id = p_application_id
     AND status = 'pending';

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  IF p_action = 'approved' THEN
    v_new_status := 'approved';
    v_remarks := COALESCE(p_notes, 'All documents approved by staff');
  ELSE
    v_new_status := 'under_review';
    v_remarks := COALESCE(p_notes, 'Documents need revision');
  END IF;

  UPDATE applications
     SET status = v_new_status::application_status,
         remarks = v_remarks
   WHERE id = p_application_id;

  INSERT INTO validations (application_id, validator_id, action, notes)
  VALUES (p_application_id, p_validator_id, p_action::validation_action, p_notes);

  RETURN json_build_object(
    'affected_rows', v_affected,
    'new_app_status', v_new_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION validate_single_requirement(
  p_submission_id  INT,
  p_validator_id   INT,
  p_action         TEXT,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_app_id     INT;
  v_total      INT;
  v_approved   INT;
BEGIN
  SELECT application_id INTO v_app_id
    FROM requirement_submissions
   WHERE id = p_submission_id;

  IF v_app_id IS NULL THEN
    RETURN json_build_object('error', 'Submission not found');
  END IF;

  UPDATE requirement_submissions
     SET status = p_action::requirement_status,
         validated_by = p_validator_id,
         validated_at = NOW(),
         validator_notes = p_notes
   WHERE id = p_submission_id;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'approved')
    INTO v_total, v_approved
    FROM requirement_submissions
   WHERE application_id = v_app_id;

  IF v_total > 0 AND v_approved = v_total THEN
    UPDATE applications
       SET status = 'approved', remarks = 'All documents validated'
     WHERE id = v_app_id AND status IN ('submitted', 'under_review');
  ELSIF p_action = 'rejected' THEN
    UPDATE applications
       SET status = 'under_review'
     WHERE id = v_app_id AND status = 'submitted';
  END IF;

  RETURN json_build_object(
    'success', true,
    'application_id', v_app_id,
    'all_approved', (v_total > 0 AND v_approved = v_total)
  );
END;
$$;
