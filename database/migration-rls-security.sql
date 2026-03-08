ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangay_access ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Deny all access to users"
  ON public.users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to applicants"
  ON public.applicants
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to applications"
  ON public.applications
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to validations"
  ON public.validations
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to requirement_submissions"
  ON public.requirement_submissions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to registration_links"
  ON public.registration_links
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

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

ALTER FUNCTION public.register_applicant(TEXT, TEXT, TEXT, TEXT, TEXT)
  SET search_path = public;

ALTER FUNCTION public.bulk_validate_requirements(INT, INT, TEXT, TEXT)
  SET search_path = public;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public;

ALTER FUNCTION public.validate_single_requirement(INT, INT, TEXT, TEXT)
  SET search_path = public;

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
