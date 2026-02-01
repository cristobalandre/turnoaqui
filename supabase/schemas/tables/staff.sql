-- Table: staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff'::text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  avatar_thumb_url text,
  avatar_full_url text,
  org_id uuid NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT staff_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations (id)
);

-- COMMENT ON TABLE public.staff IS '_your_comment_here_';

