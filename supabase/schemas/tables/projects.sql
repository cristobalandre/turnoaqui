-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  title text NOT NULL,
  artist text DEFAULT 'Artista'::text,
  status text DEFAULT 'En Revisión'::text,
  version text DEFAULT 'v1.0'::text,
  audio_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  reviewer_name text,
  reviewer_avatar text,
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT projects_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.projects IS '_your_comment_here_';

