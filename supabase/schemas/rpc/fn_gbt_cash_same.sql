-- Function: public.gbt_cash_same(gbtreekey16, gbtreekey16, internal)
CREATE OR REPLACE FUNCTION public.gbt_cash_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_same$function$
;

-- COMMENT ON FUNCTION public.gbt_cash_same(gbtreekey16, gbtreekey16, internal) IS '_your_comment_here_';

