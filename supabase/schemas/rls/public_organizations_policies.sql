-- RLS Policies for public.organizations
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY Ver mi organizacion
  ON public.organizations
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((id = ( SELECT profiles.org_id
   FROM profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1)))
;

