-- Table: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- COMMENT ON TABLE public.organizations IS '_your_comment_here_';

