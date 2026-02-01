-- RLS Policies for public.clients
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY Aislamiento Clients
  ON public.clients
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((org_id = get_my_org_id()))
  WITH CHECK ((org_id = get_my_org_id()))
;

CREATE POLICY clients_delete_fixed_org
  ON public.clients
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY clients_insert_fixed_org
  ON public.clients
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY clients_select_fixed_org
  ON public.clients
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

CREATE POLICY clients_update_fixed_org
  ON public.clients
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
  WITH CHECK ((org_id = 'a573aa05-d62b-44c7-a878-b9138902a094'::uuid))
;

