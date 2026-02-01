-- Function: public.handle_payment_date()
CREATE OR REPLACE FUNCTION public.handle_payment_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si cambia a 'paid', guardamos la fecha actual
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    NEW.paid_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

-- COMMENT ON FUNCTION public.handle_payment_date() IS '_your_comment_here_';

