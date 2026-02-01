-- Function: public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_timetz_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal) IS '_your_comment_here_';

