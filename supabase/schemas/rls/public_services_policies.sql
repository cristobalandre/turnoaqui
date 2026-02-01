-- RLS Policies for public.services
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Services
  ON public.services
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

