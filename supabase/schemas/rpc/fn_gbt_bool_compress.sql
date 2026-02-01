-- Function: public.gbt_bool_compress(internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_compress$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_compress(internal) IS '_your_comment_here_';

