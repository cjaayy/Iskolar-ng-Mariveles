CREATE TYPE user_role AS ENUM ('admin', 'validator', 'applicant');

CREATE TYPE application_status AS ENUM (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
);

CREATE TYPE validation_action AS ENUM (
  'approved', 'rejected', 'returned', 'requested_info'
);

CREATE TYPE requirement_status AS ENUM (
  'missing', 'in_progress', 'pending', 'approved', 'rejected'
);

CREATE TABLE users (
  id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email             VARCHAR(255)   NOT NULL UNIQUE,
  password_hash     VARCHAR(255)   NOT NULL,
  full_name         VARCHAR(150)   NOT NULL,
  role              user_role      NOT NULL DEFAULT 'applicant',
  is_active         BOOLEAN        NOT NULL DEFAULT true,
  assigned_barangay VARCHAR(100)   DEFAULT NULL,
  assigned_school   VARCHAR(255)   DEFAULT NULL,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to users"
  ON public.users FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE applicants (
  id                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                INT            NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  date_of_birth          DATE,
  contact_number         VARCHAR(20),
  address                TEXT,
  gender                 VARCHAR(10),
  blood_type             VARCHAR(5),
  civil_status           VARCHAR(20),
  maiden_name            VARCHAR(150),
  spouse_name            VARCHAR(150),
  spouse_occupation      VARCHAR(150),
  religion               VARCHAR(60),
  height_cm              NUMERIC(5,1),
  weight_kg              NUMERIC(5,1),
  birthplace             VARCHAR(255),
  house_street           VARCHAR(255),
  town                   VARCHAR(100),
  barangay               VARCHAR(100),
  current_school         VARCHAR(255),
  year_level             VARCHAR(50),
  father_name            VARCHAR(150),
  father_occupation      VARCHAR(150),
  father_contact         VARCHAR(20),
  mother_name            VARCHAR(150),
  mother_occupation      VARCHAR(150),
  mother_contact         VARCHAR(20),
  guardian_name          VARCHAR(150),
  guardian_relation       VARCHAR(60),
  guardian_contact        VARCHAR(20),
  primary_school         VARCHAR(200),
  primary_address        VARCHAR(255),
  primary_year_graduated SMALLINT,
  secondary_school       VARCHAR(200),
  secondary_address      VARCHAR(255),
  secondary_year_graduated SMALLINT,
  tertiary_school        VARCHAR(200),
  tertiary_address       VARCHAR(255),
  tertiary_year_graduated  SMALLINT,
  tertiary_program       VARCHAR(200),
  created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to applicants"
  ON public.applicants FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE applications (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  applicant_id          INT                NOT NULL UNIQUE REFERENCES applicants (id) ON DELETE CASCADE,
  status                application_status NOT NULL DEFAULT 'draft',
  income_at_submission  NUMERIC(10,2),
  documents             JSONB,
  remarks               TEXT,
  submitted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_status ON applications (status);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to applications"
  ON public.applications FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE validations (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id  INT               NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  validator_id    INT               NOT NULL REFERENCES users (id),
  action          validation_action NOT NULL,
  checklist       JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_validations_application ON validations (application_id);
CREATE INDEX idx_validations_validator   ON validations (validator_id);

ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to validations"
  ON public.validations FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE requirement_submissions (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id  INT                NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  requirement_key VARCHAR(60)        NOT NULL,
  status          requirement_status NOT NULL DEFAULT 'missing',
  progress        SMALLINT           NOT NULL DEFAULT 0,
  file_name       VARCHAR(255),
  file_url        VARCHAR(500),
  uploaded_at     TIMESTAMPTZ,
  notes           TEXT,
  validated_by    INT                REFERENCES users (id),
  validated_at    TIMESTAMPTZ,
  validator_notes TEXT,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, requirement_key)
);

CREATE INDEX idx_req_sub_status ON requirement_submissions (status);

ALTER TABLE requirement_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to requirement_submissions"
  ON public.requirement_submissions FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TYPE education_level AS ENUM ('elementary', 'high_school', 'senior_high');

CREATE TABLE registration_links (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token         VARCHAR(64)     NOT NULL UNIQUE,
  label         VARCHAR(150),
  education_level education_level NOT NULL DEFAULT 'senior_high',
  description   TEXT,
  max_uses      INT           NOT NULL DEFAULT 1,
  times_used    INT           NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_by    INT           NOT NULL REFERENCES users (id),
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reg_links_token  ON registration_links (token);
CREATE INDEX idx_reg_links_active ON registration_links (is_active);
CREATE INDEX idx_reg_links_education_level ON registration_links (education_level);

ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to registration_links"
  ON public.registration_links FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE barangay_access (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barangay              VARCHAR(100) NOT NULL UNIQUE,
  is_open               BOOLEAN      NOT NULL DEFAULT false,
  submission_open_date  DATE,
  submission_close_date DATE,
  updated_by            INT          REFERENCES users (id),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE barangay_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to barangay_access"
  ON public.barangay_access FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Deny write access to barangay_access"
  ON public.barangay_access FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny update access to barangay_access"
  ON public.barangay_access FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny delete access to barangay_access"
  ON public.barangay_access FOR DELETE TO anon, authenticated
  USING (false);

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

CREATE INDEX idx_school_access_level ON school_access (education_level);
CREATE INDEX idx_school_access_open ON school_access (is_open);

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

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applicants_updated_at
  BEFORE UPDATE ON applicants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_requirement_submissions_updated_at
  BEFORE UPDATE ON requirement_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_registration_links_updated_at
  BEFORE UPDATE ON registration_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_barangay_access_updated_at
  BEFORE UPDATE ON barangay_access FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_school_access_updated_at
  BEFORE UPDATE ON school_access FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@iskolar.local',
  '$2b$10$iXNCksNq2VCEDqXK5QKAyeClxU1UrTNvlOBpVgR5R.E3YnwHImbHC',
  'System Administrator',
  'admin'
);

INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'demo@iskolar.local',
  '$2b$10$eBGjYlPJfVi6CHAOYFZ4XOUpch2/3PhzypmM1LSPUvkiU1iEMa6zy',
  'Juan Dela Cruz',
  'applicant'
);

INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'staff@iskolar.local',
  '$2b$10$6MQyB60DycqiR2Cs2Fcr1..jQM4AdCcYudNWe2xAQ2qrdm8i9ZO6a',
  'Staff Validator',
  'validator'
);

INSERT INTO applicants (user_id, date_of_birth, contact_number)
VALUES (2, '2004-06-15', '+63 917 123 4567');

INSERT INTO applications (applicant_id, status, income_at_submission, submitted_at)
VALUES (1, 'under_review', 15000.00, NOW());

INSERT INTO barangay_access (barangay) VALUES
  ('Alas-asin'),
  ('Alion'),
  ('Balon-Anito'),
  ('Baseco Country (Bataan Shipyard)'),
  ('Batangas II'),
  ('Biaan'),
  ('Cabcaben'),
  ('Camaya'),
  ('Casili (Cataning)'),
  ('Ipag'),
  ('Lucanin'),
  ('Malaya'),
  ('Maligaya'),
  ('Mt. View'),
  ('Poblacion'),
  ('San Carlos'),
  ('San Isidro'),
  ('Sisiman'),
  ('Townsite');
