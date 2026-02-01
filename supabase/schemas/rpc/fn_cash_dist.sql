-- Function: public.cash_dist(money, money)
CREATE OR REPLACE FUNCTION public.cash_dist(money, money)
 RETURNS money
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$cash_dist$function$
;

-- COMMENT ON FUNCTION public.cash_dist(money, money) IS '_your_comment_here_';

