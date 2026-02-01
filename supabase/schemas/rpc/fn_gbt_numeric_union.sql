-- Function: public.gbt_numeric_union(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_numeric_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_union$function$
;

-- COMMENT ON FUNCTION public.gbt_numeric_union(internal, internal) IS '_your_comment_here_';

