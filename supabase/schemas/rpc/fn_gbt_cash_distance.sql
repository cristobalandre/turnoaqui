-- Function: public.gbt_cash_distance(internal, money, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal) IS '_your_comment_here_';

