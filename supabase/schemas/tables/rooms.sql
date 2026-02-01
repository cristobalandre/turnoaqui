-- Table: rooms
CREATE TABLE IF NOT EXISTS rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT rooms_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.rooms IS '_your_comment_here_';

