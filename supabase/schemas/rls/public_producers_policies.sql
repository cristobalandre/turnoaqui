-- RLS Policies for public.producers
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Producers
  ON public.producers
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

