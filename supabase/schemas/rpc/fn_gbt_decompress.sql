-- Function: public.gbt_decompress(internal)
CREATE OR REPLACE FUNCTION public.gbt_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_decompress$function$
;

-- COMMENT ON FUNCTION public.gbt_decompress(internal) IS '_your_comment_here_';

