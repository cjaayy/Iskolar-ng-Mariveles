-- ============================================================
--  Migration: Add Basic Information fields to applicants table
--  Run this after the initial schema.sql
-- ============================================================

USE scholarship_system;

-- Personal details
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS gender           ENUM('Male','Female')  NULL AFTER date_of_birth,
  ADD COLUMN IF NOT EXISTS blood_type       VARCHAR(5)             NULL AFTER gender,
  ADD COLUMN IF NOT EXISTS civil_status     VARCHAR(20)            NULL AFTER blood_type,
  ADD COLUMN IF NOT EXISTS maiden_name      VARCHAR(150)           NULL AFTER civil_status,
  ADD COLUMN IF NOT EXISTS spouse_name      VARCHAR(150)           NULL AFTER maiden_name,
  ADD COLUMN IF NOT EXISTS spouse_occupation VARCHAR(150)          NULL AFTER spouse_name,
  ADD COLUMN IF NOT EXISTS religion         VARCHAR(60)            NULL AFTER spouse_occupation,
  ADD COLUMN IF NOT EXISTS height_cm        DECIMAL(5,1)           NULL AFTER religion,
  ADD COLUMN IF NOT EXISTS weight_kg        DECIMAL(5,1)           NULL AFTER height_cm,
  ADD COLUMN IF NOT EXISTS birthplace       VARCHAR(255)           NULL AFTER weight_kg,
  ADD COLUMN IF NOT EXISTS house_street     VARCHAR(255)           NULL AFTER birthplace,
  ADD COLUMN IF NOT EXISTS town             VARCHAR(100)           NULL AFTER house_street,
  ADD COLUMN IF NOT EXISTS barangay         VARCHAR(100)           NULL AFTER town;

-- Parent / Guardian details
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS father_name      VARCHAR(150)           NULL AFTER barangay,
  ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(150)          NULL AFTER father_name,
  ADD COLUMN IF NOT EXISTS father_contact   VARCHAR(20)            NULL AFTER father_occupation,
  ADD COLUMN IF NOT EXISTS mother_name      VARCHAR(150)           NULL AFTER father_contact,
  ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(150)          NULL AFTER mother_name,
  ADD COLUMN IF NOT EXISTS mother_contact   VARCHAR(20)            NULL AFTER mother_occupation,
  ADD COLUMN IF NOT EXISTS guardian_name    VARCHAR(150)           NULL AFTER mother_contact,
  ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(60)           NULL AFTER guardian_name,
  ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(20)            NULL AFTER guardian_relation;

-- Education details
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS primary_school            VARCHAR(200)  NULL AFTER guardian_contact,
  ADD COLUMN IF NOT EXISTS primary_address            VARCHAR(255)  NULL AFTER primary_school,
  ADD COLUMN IF NOT EXISTS primary_year_graduated     YEAR          NULL AFTER primary_address,
  ADD COLUMN IF NOT EXISTS secondary_school           VARCHAR(200)  NULL AFTER primary_year_graduated,
  ADD COLUMN IF NOT EXISTS secondary_address          VARCHAR(255)  NULL AFTER secondary_school,
  ADD COLUMN IF NOT EXISTS secondary_year_graduated   YEAR          NULL AFTER secondary_address,
  ADD COLUMN IF NOT EXISTS tertiary_school            VARCHAR(200)  NULL AFTER secondary_year_graduated,
  ADD COLUMN IF NOT EXISTS tertiary_address           VARCHAR(255)  NULL AFTER tertiary_school,
  ADD COLUMN IF NOT EXISTS tertiary_year_graduated    YEAR          NULL AFTER tertiary_address,
  ADD COLUMN IF NOT EXISTS tertiary_program           VARCHAR(200)  NULL AFTER tertiary_year_graduated;

-- Others
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS skills            TEXT                  NULL AFTER tertiary_program,
  ADD COLUMN IF NOT EXISTS hobbies           TEXT                  NULL AFTER skills,
  ADD COLUMN IF NOT EXISTS organizations     TEXT                  NULL AFTER hobbies,
  ADD COLUMN IF NOT EXISTS awards            TEXT                  NULL AFTER organizations;
