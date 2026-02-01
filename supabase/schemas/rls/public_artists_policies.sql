-- RLS Policies for public.artists
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Artists
  ON public.artists
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY Artists Public Access
  ON public.artists
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

