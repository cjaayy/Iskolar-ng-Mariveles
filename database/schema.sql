CREATE DATABASE IF NOT EXISTS scholarship_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE scholarship_system;

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

CREATE TABLE IF NOT EXISTS applicants (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED    NOT NULL,
  date_of_birth     DATE            NULL,
  contact_number    VARCHAR(20)     NULL,
  address           TEXT            NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_applicants_user   (user_id),
  CONSTRAINT fk_applicants_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  applicant_id    INT UNSIGNED    NOT NULL,
  status          ENUM('draft','submitted','under_review','approved','rejected','withdrawn')
                                  NOT NULL DEFAULT 'draft',
  income_at_submission        DECIMAL(10,2) NULL,
  documents                   JSON          NULL,
  remarks                     TEXT          NULL             COMMENT 'Validator notes',
  submitted_at                TIMESTAMP     NULL,
  created_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_applications_applicant (applicant_id),
  INDEX         idx_applications_status (status),
  CONSTRAINT fk_applications_applicant
    FOREIGN KEY (applicant_id)   REFERENCES applicants   (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validations (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED    NOT NULL,
  validator_id    INT UNSIGNED    NOT NULL               COMMENT 'users.id of the reviewer',
  action          ENUM('approved','rejected','returned','requested_info')
                                  NOT NULL,
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

CREATE TABLE IF NOT EXISTS requirement_submissions (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED  NOT NULL,
  requirement_key VARCHAR(60)   NOT NULL,
  status          ENUM('missing','in_progress','pending','approved','rejected')
                                NOT NULL DEFAULT 'missing',
  progress        TINYINT       NOT NULL DEFAULT 0,
  file_name       VARCHAR(255)  NULL,
  file_url        VARCHAR(500)  NULL                COMMENT 'server path to uploaded file',
  uploaded_at     TIMESTAMP     NULL,
  notes           TEXT          NULL,
  validated_by    INT UNSIGNED  NULL                COMMENT 'users.id of validator/staff who reviewed',
  validated_at    TIMESTAMP     NULL,
  validator_notes TEXT          NULL                COMMENT 'feedback from staff',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_req_sub (application_id, requirement_key),
  INDEX idx_req_sub_status (status),
  CONSTRAINT fk_req_sub_app
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_req_sub_validator
    FOREIGN KEY (validated_by)   REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS registration_links (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  token         VARCHAR(64)       NOT NULL UNIQUE          COMMENT 'Unique URL-safe token',
  label         VARCHAR(150)      NULL                     COMMENT 'Admin-friendly label for this link',
  max_uses      INT UNSIGNED      NOT NULL DEFAULT 1       COMMENT '0 = unlimited',
  times_used    INT UNSIGNED      NOT NULL DEFAULT 0,
  expires_at    TIMESTAMP         NULL                     COMMENT 'NULL = never expires',
  created_by    INT UNSIGNED      NOT NULL                 COMMENT 'users.id of admin who created it',
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_reg_links_token   (token),
  INDEX idx_reg_links_active  (is_active),
  CONSTRAINT fk_reg_links_creator
    FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB;

INSERT IGNORE INTO users (id, email, password_hash, full_name, role)
VALUES (1, 'admin@iskolar.local',
        '$2b$10$iXNCksNq2VCEDqXK5QKAyeClxU1UrTNvlOBpVgR5R.E3YnwHImbHC',
        'System Administrator', 'admin');

INSERT IGNORE INTO users (id, email, password_hash, full_name, role)
VALUES (2, 'demo@iskolar.local',
        '$2b$10$eBGjYlPJfVi6CHAOYFZ4XOUpch2/3PhzypmM1LSPUvkiU1iEMa6zy',
        'Juan Dela Cruz', 'applicant');

INSERT IGNORE INTO users (id, email, password_hash, full_name, role)
VALUES (3, 'staff@iskolar.local',
        '$2b$10$6MQyB60DycqiR2Cs2Fcr1..jQM4AdCcYudNWe2xAQ2qrdm8i9ZO6a',
        'Staff Validator', 'validator');
