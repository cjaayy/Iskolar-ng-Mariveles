-- Migration: Drop unused columns from users
-- Date: 2026-04-12

ALTER TABLE public.users
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS photo_url,
  DROP COLUMN IF EXISTS birthday,
  DROP COLUMN IF EXISTS couple_id,
  DROP COLUMN IF EXISTS invite_code,
  DROP COLUMN IF EXISTS profile_complete;
