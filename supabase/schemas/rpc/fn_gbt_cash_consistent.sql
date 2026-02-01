-- Function: public.gbt_cash_consistent(internal, money, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal) IS '_your_comment_here_';

