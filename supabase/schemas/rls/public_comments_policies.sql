-- RLS Policies for public.comments
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY Acceso Publico Comentarios
  ON public.comments
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

CREATE POLICY Aislamiento Comments
  ON public.comments
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY Solo Usuarios Registrados Comentarios
  ON public.comments
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true)
;

