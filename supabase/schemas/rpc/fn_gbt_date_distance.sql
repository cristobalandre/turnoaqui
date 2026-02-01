-- Function: public.gbt_date_distance(internal, date, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_distance$function$
;

-- COMMENT ON FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal) IS '_your_comment_here_';

