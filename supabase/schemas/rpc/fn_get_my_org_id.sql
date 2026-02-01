-- Function: public.get_my_org_id()
CREATE OR REPLACE FUNCTION public.get_my_org_id()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$function$
;

-- COMMENT ON FUNCTION public.get_my_org_id() IS '_your_comment_here_';

