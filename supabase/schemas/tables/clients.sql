-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  avatar_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- COMMENT ON TABLE public.clients IS '_your_comment_here_';

