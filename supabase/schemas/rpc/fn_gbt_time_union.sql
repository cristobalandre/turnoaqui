-- Function: public.gbt_time_union(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_time_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_union$function$
;

-- COMMENT ON FUNCTION public.gbt_time_union(internal, internal) IS '_your_comment_here_';

