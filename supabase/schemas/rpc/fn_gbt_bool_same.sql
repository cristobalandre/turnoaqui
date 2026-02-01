-- Function: public.gbt_bool_same(gbtreekey2, gbtreekey2, internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_same(gbtreekey2, gbtreekey2, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_same$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_same(gbtreekey2, gbtreekey2, internal) IS '_your_comment_here_';

