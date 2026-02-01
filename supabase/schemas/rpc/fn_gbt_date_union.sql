-- Function: public.gbt_date_union(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_date_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_union$function$
;

-- COMMENT ON FUNCTION public.gbt_date_union(internal, internal) IS '_your_comment_here_';

