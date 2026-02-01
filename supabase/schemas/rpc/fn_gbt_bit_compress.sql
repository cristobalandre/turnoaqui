-- Function: public.gbt_bit_compress(internal)
CREATE OR REPLACE FUNCTION public.gbt_bit_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_compress$function$
;

-- COMMENT ON FUNCTION public.gbt_bit_compress(internal) IS '_your_comment_here_';

