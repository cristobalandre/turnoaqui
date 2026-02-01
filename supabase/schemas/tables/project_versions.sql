-- Table: project_versions
CREATE TABLE IF NOT EXISTS project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  version_name text NOT NULL,
  audio_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT project_versions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT project_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects (id)
);

-- COMMENT ON TABLE public.project_versions IS '_your_comment_here_';

