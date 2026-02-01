-- RLS Policies for public.project_versions
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Project Versions
  ON public.project_versions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY Auth insert versions
  ON public.project_versions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.role() = 'authenticated'::text))
;

CREATE POLICY Public read versions
  ON public.project_versions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true)
;

