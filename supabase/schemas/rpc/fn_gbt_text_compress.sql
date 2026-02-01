-- Function: public.gbt_text_compress(internal)
CREATE OR REPLACE FUNCTION public.gbt_text_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_compress$function$
;

-- COMMENT ON FUNCTION public.gbt_text_compress(internal) IS '_your_comment_here_';

