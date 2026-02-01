-- Table: project_comments
CREATE TABLE IF NOT EXISTS project_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  version_id uuid,
  user_name text,
  content text NOT NULL,
  timestamp double precision,
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT project_comments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.project_comments IS '_your_comment_here_';

