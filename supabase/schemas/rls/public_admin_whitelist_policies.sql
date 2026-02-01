-- RLS Policies for public.admin_whitelist
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY Leer Lista VIP
  ON public.admin_whitelist
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true)
;

