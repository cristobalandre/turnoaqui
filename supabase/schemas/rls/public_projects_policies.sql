-- RLS Policies for public.projects
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY Acceso Publico Projects
  ON public.projects
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY Aislamiento Projects
  ON public.projects
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY Solo Usuarios Registrados
  ON public.projects
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true)
;

