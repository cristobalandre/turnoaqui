-- Table: artists
CREATE TABLE IF NOT EXISTS artists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  bio text,
  image_url text,
  user_id uuid,
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT artists_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.artists IS '_your_comment_here_';

