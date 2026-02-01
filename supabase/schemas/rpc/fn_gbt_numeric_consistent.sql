-- Function: public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal) IS '_your_comment_here_';

