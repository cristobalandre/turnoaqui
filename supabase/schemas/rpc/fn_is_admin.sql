-- Function: public.is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$
;

-- COMMENT ON FUNCTION public.is_admin() IS '_your_comment_here_';

