-- Function: public.gbt_intv_distance(internal, interval, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal) IS '_your_comment_here_';

