-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL,
  org_id uuid,
  role text DEFAULT 'admin'::text,
  plan_status text DEFAULT 'inactive'::text,
  full_name text,
  email text,
  plan text DEFAULT 'free'::text,
  avatar_url text,
  PRIMARY KEY (id)
);

-- COMMENT ON TABLE public.profiles IS '_your_comment_here_';

