-- Table: notifications_log
CREATE TABLE IF NOT EXISTS notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  channel text NOT NULL,
  type text NOT NULL,
  to_value text NOT NULL,
  status text NOT NULL DEFAULT 'sent'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- COMMENT ON TABLE public.notifications_log IS '_your_comment_here_';

