-- Migration: Drop redundant display_name column from users
-- Date: 2026-04-12

ALTER TABLE public.users
  DROP COLUMN IF EXISTS display_name;
