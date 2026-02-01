-- Function: public.gbt_bool_union(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_union(internal, internal)
 RETURNS gbtreekey2
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_union$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_union(internal, internal) IS '_your_comment_here_';

