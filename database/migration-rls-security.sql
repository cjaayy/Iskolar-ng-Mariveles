-- ============================================================
--  Iskolar ng Mariveles — RLS & Security Migration
--  Run this in the Supabase SQL Editor AFTER schema-supabase.sql
--  and functions.sql.
--
--  Fixes:
--    1. Enable RLS on all 7 public tables
--    2. Add restrictive policies (service_role bypasses RLS automatically)
--    3. Set search_path on all 4 public functions
-- ============================================================

-- ─── 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES ─────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangay_access ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS POLICIES ────────────────────────────────────────
--
-- Since the app uses the service_role key for ALL server-side queries,
-- and service_role automatically bypasses RLS, these policies only
-- control access via the anon key (PostgREST / client-side).
--
-- Strategy:
--   - Block all direct access via anon/authenticated for sensitive tables
--   - Allow read-only public access only for barangay_access (public info)
--   - Allow anon to call register_applicant RPC (which runs as SECURITY INVOKER
--     but the function itself uses the caller's context — service_role handles this)

-- ── Drop existing policies (safe to re-run) ───────────────

DROP POLICY IF EXISTS "Deny all access to users" ON public.users;
DROP POLICY IF EXISTS "Deny all access to applicants" ON public.applicants;
DROP POLICY IF EXISTS "Deny all access to applications" ON public.applications;
DROP POLICY IF EXISTS "Deny all access to validations" ON public.validations;
DROP POLICY IF EXISTS "Deny all access to requirement_submissions" ON public.requirement_submissions;
DROP POLICY IF EXISTS "Deny all access to registration_links" ON public.registration_links;
DROP POLICY IF EXISTS "Allow public read access to barangay_access" ON public.barangay_access;
DROP POLICY IF EXISTS "Deny write access to barangay_access" ON public.barangay_access;
DROP POLICY IF EXISTS "Deny update access to barangay_access" ON public.barangay_access;
DROP POLICY IF EXISTS "Deny delete access to barangay_access" ON public.barangay_access;

-- ── users: no direct access via anon/authenticated ──────────

CREATE POLICY "Deny all access to users"
  ON public.users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── applicants: no direct access via anon/authenticated ─────

CREATE POLICY "Deny all access to applicants"
  ON public.applicants
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── applications: no direct access via anon/authenticated ───

CREATE POLICY "Deny all access to applications"
  ON public.applications
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── validations: no direct access via anon/authenticated ────

CREATE POLICY "Deny all access to validations"
  ON public.validations
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── requirement_submissions: no direct access ───────────────

CREATE POLICY "Deny all access to requirement_submissions"
  ON public.requirement_submissions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── registration_links: no direct access (protects tokens) ──

CREATE POLICY "Deny all access to registration_links"
  ON public.registration_links
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ── barangay_access: allow public read-only ─────────────────
-- This table's data is publicly accessible via /api/barangay-access
-- and contains no sensitive information.

CREATE POLICY "Allow public read access to barangay_access"
  ON public.barangay_access
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Deny write access to barangay_access"
  ON public.barangay_access
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny update access to barangay_access"
  ON public.barangay_access
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny delete access to barangay_access"
  ON public.barangay_access
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- ─── 3. FIX FUNCTION SEARCH_PATH ────────────────────────────
-- Setting search_path to '' (empty) prevents search_path injection attacks.
-- All table references in the functions use unqualified names, which is fine
-- because they were created in the public schema. We set search_path to
-- 'public' so the functions continue to resolve table names correctly.

ALTER FUNCTION public.register_applicant(TEXT, TEXT, TEXT, TEXT, TEXT)
  SET search_path = public;

ALTER FUNCTION public.bulk_validate_requirements(INT, INT, TEXT, TEXT)
  SET search_path = public;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public;

ALTER FUNCTION public.validate_single_requirement(INT, INT, TEXT, TEXT)
  SET search_path = public;

-- ─── 4. SEED BARANGAY ACCESS DATA ─────────────────────────────
-- All 19 barangays of Mariveles, Bataan — closed by default.
-- Uses ON CONFLICT to skip any that already exist.

INSERT INTO public.barangay_access (barangay) VALUES
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
  ('Townsite')
ON CONFLICT (barangay) DO NOTHING;
