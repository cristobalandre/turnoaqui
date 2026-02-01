-- Table: comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  user_email text,
  content text NOT NULL,
  timestamp text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  avatar_url text,
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT comments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT comments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects (id)
);

-- COMMENT ON TABLE public.comments IS '_your_comment_here_';

