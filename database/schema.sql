-- ============================================================
--  Iskolar ng Mariveles — Scholarship System Database Schema
--  XAMPP MySQL · localhost:3306
--  Run this file via phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS scholarship_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE scholarship_system;

-- ------------------------------------------------------------
-- 1. USERS  (system accounts: admin, validator, applicant)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)      NOT NULL UNIQUE,
  password_hash VARCHAR(255)      NOT NULL,
  full_name     VARCHAR(150)      NOT NULL,
  role          ENUM('admin','validator','applicant') NOT NULL DEFAULT 'applicant',
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. APPLICANTS  (extended profile linked to a user account)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicants (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED    NOT NULL,
  student_number    VARCHAR(30)     NOT NULL UNIQUE,
  date_of_birth     DATE            NOT NULL,
  contact_number    VARCHAR(20)     NULL,
  address           TEXT            NULL,
  -- Academic info
  gpa               DECIMAL(4,2)    NOT NULL DEFAULT 0.00   COMMENT 'Current GPA out of 4.00',
  year_level        TINYINT         NOT NULL DEFAULT 1,
  course            VARCHAR(100)    NOT NULL,
  college           VARCHAR(100)    NOT NULL,
  -- Financial info
  monthly_income    DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT 'Family monthly income (PHP)',
  household_size    TINYINT         NOT NULL DEFAULT 1,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_applicants_user   (user_id),
  INDEX        idx_applicants_gpa    (gpa),
  CONSTRAINT fk_applicants_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. SCHOLARSHIPS  (scholarship program definitions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarships (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(150)    NOT NULL,
  description           TEXT            NULL,
  grantor               VARCHAR(100)    NOT NULL               COMMENT 'Funding source / organization',
  -- Eligibility criteria
  min_gpa               DECIMAL(4,2)    NOT NULL DEFAULT 0.00,
  max_monthly_income    DECIMAL(10,2)   NULL                   COMMENT 'NULL = no income cap',
  max_year_level        TINYINT         NULL                   COMMENT 'NULL = all year levels',
  -- Availability
  slots_available       INT UNSIGNED    NOT NULL DEFAULT 0,
  slots_total           INT UNSIGNED    NOT NULL DEFAULT 0,
  application_open      DATE            NOT NULL,
  application_close     DATE            NOT NULL,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_scholarships_active (is_active, application_close)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. APPLICATIONS  (student application per scholarship)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  applicant_id    INT UNSIGNED    NOT NULL,
  scholarship_id  INT UNSIGNED    NOT NULL,
  status          ENUM('draft','submitted','under_review','approved','rejected','withdrawn')
                                  NOT NULL DEFAULT 'draft',
  -- Snapshot of eligibility at time of submission
  gpa_at_submission           DECIMAL(4,2)  NULL,
  income_at_submission        DECIMAL(10,2) NULL,
  -- Documents (JSON array of file paths / URLs)
  documents                   JSON          NULL,
  remarks                     TEXT          NULL             COMMENT 'Validator notes',
  submitted_at                TIMESTAMP     NULL,
  created_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_applications_unique (applicant_id, scholarship_id),
  INDEX         idx_applications_status (status),
  CONSTRAINT fk_applications_applicant
    FOREIGN KEY (applicant_id)   REFERENCES applicants   (id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_scholarship
    FOREIGN KEY (scholarship_id) REFERENCES scholarships (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. VALIDATIONS  (audit trail of every review action)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS validations (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED    NOT NULL,
  validator_id    INT UNSIGNED    NOT NULL               COMMENT 'users.id of the reviewer',
  action          ENUM('approved','rejected','returned','requested_info')
                                  NOT NULL,
  -- Checklist results (JSON: { gpa: true, income: true, documents: false })
  checklist       JSON            NULL,
  notes           TEXT            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_validations_application (application_id),
  INDEX idx_validations_validator   (validator_id),
  CONSTRAINT fk_validations_application
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_validations_validator
    FOREIGN KEY (validator_id)   REFERENCES users        (id)
) ENGINE=InnoDB;

-- ============================================================
--  SEED DATA  (safe to re-run — uses INSERT IGNORE)
-- ============================================================

-- Default admin account  (password: Admin@1234 — change in production!)
INSERT IGNORE INTO users (id, email, password_hash, full_name, role)
VALUES (1, 'admin@iskolar.local',
        '$2b$10$Hd98SNsIXXKZUW0LloOdvem5.efA2UOb5.//jEGRywFnRfFhFxS.C',   -- Admin@1234 (bcrypt 10 rounds)
        'System Administrator', 'admin');

-- Sample scholarship
INSERT IGNORE INTO scholarships
  (id, name, grantor, min_gpa, max_monthly_income, slots_available, slots_total,
   application_open, application_close)
VALUES
  (1, 'CHED Study Now Pay Later',     'CHED',           2.50, 40000.00, 50, 50, '2026-01-01', '2026-06-30'),
  (2, 'Mariveles Municipal Scholarship', 'LGU Mariveles', 2.75, 25000.00, 20, 20, '2026-01-01', '2026-05-31'),
  (3, 'DOST-SEI Scholarship',         'DOST',           3.50,  NULL,     30, 30, '2026-02-01', '2026-04-30');
