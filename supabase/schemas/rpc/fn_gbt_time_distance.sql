-- Function: public.gbt_time_distance(internal, time without time zone, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal) IS '_your_comment_here_';

