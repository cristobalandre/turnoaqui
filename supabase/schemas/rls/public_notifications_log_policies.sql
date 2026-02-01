-- RLS Policies for public.notifications_log
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Notifications
  ON public.notifications_log
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

