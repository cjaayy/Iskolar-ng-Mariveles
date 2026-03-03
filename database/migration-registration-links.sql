-- ============================================================
--  Migration: Registration Links (Pre-registration invite system)
--  Adds a table for admin-generated registration links
-- ============================================================

USE scholarship_system;

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
