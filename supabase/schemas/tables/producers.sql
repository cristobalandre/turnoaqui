-- Table: producers
CREATE TABLE IF NOT EXISTS producers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT producers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.producers IS '_your_comment_here_';

