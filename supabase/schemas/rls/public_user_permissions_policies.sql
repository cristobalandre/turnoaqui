-- RLS Policies for public.user_permissions
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY Admin Permissions Access
  ON public.user_permissions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
;

