-- Function: public.set_paid_at()
CREATE OR REPLACE FUNCTION public.set_paid_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.payment_status = 'paid'::public.booking_payment_status
     AND (OLD.payment_status IS DISTINCT FROM 'paid'::public.booking_payment_status) THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());

  ELSIF NEW.payment_status = 'pending'::public.booking_payment_status THEN
    NEW.paid_at := NULL;
  END IF;

  RETURN NEW;
END;
$function$
;

-- COMMENT ON FUNCTION public.set_paid_at() IS '_your_comment_here_';

