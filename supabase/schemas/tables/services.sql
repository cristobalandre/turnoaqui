-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  price integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT services_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.services IS '_your_comment_here_';

