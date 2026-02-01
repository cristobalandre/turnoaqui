-- RLS Policies for public.bookings
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Bookings
  ON public.bookings
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY Public Insert
  ON public.bookings
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (true)
;

CREATE POLICY Public Read
  ON public.bookings
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (true)
;

CREATE POLICY Tenant Isolation All
  ON public.bookings
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((org_id IN ( SELECT profiles.org_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))))
;

CREATE POLICY Ver reservas publicas
  ON public.bookings
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (true)
;

CREATE POLICY bookings_delete_fixed_org
  ON public.bookings
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY bookings_insert_fixed_org
  ON public.bookings
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY bookings_select_fixed_org
  ON public.bookings
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY bookings_update_fixed_org
  ON public.bookings
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
  WITH CHECK ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

