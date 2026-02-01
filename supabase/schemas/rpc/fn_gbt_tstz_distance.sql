-- Function: public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_tstz_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal) IS '_your_comment_here_';

