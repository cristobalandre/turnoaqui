-- Table: user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id uuid NOT NULL,
  access_calendar boolean DEFAULT false,
  access_roster boolean DEFAULT false,
  access_finance boolean DEFAULT false,
  PRIMARY KEY (user_id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id)
);

-- COMMENT ON TABLE public.user_permissions IS '_your_comment_here_';

