-- Function: public.gbt_float8_consistent(internal, double precision, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal) IS '_your_comment_here_';

