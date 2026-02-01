-- RLS Policies for public.project_comments
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Project Comments
  ON public.project_comments
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

