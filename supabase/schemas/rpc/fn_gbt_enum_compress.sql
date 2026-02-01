-- Function: public.gbt_enum_compress(internal)
CREATE OR REPLACE FUNCTION public.gbt_enum_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_compress$function$
;

-- COMMENT ON FUNCTION public.gbt_enum_compress(internal) IS '_your_comment_here_';

