-- Function: public.gbt_float8_distance(internal, double precision, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal) IS '_your_comment_here_';

