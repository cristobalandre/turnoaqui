-- RLS Policies for public.staff
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Staff
  ON public.staff
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

