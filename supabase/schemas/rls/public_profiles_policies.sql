-- RLS Policies for public.profiles
-- Row Level Security policies to control data access at the row level

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY Admin All Access
  ON public.profiles
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
;

CREATE POLICY Admin ve todo
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((( SELECT profiles_1.role
   FROM profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'admin'::text) OR (auth.uid() = id)))
;

CREATE POLICY Admins editan todo
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((is_admin() = true))
;

CREATE POLICY Editar mi propio perfil
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((id = auth.uid()))
;

CREATE POLICY Editar perfil propio
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((( SELECT auth.uid() AS uid) = id))
;

CREATE POLICY Enable insert for users based on id
  ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = id))
;

CREATE POLICY Enable read access for authenticated users
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.role() = 'authenticated'::text))
;

CREATE POLICY Enable update for users based on id
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = id))
;

CREATE POLICY Users can insert own profile
  ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = id))
;

CREATE POLICY Ver mi propio perfil
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((id = auth.uid()))
;

