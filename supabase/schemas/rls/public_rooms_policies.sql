-- RLS Policies for public.rooms
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Rooms
  ON public.rooms
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY org_fixed_insert
  ON public.rooms
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY org_fixed_select
  ON public.rooms
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

