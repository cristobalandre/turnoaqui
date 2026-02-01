-- Function: public.auto_assign_org_id()
CREATE OR REPLACE FUNCTION public.auto_assign_org_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Si el dato llega sin org_id, buscamos el del usuario actual y se lo ponemos
  IF NEW.org_id IS NULL THEN
    NEW.org_id := (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid() 
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$function$
;

-- COMMENT ON FUNCTION public.auto_assign_org_id() IS '_your_comment_here_';

