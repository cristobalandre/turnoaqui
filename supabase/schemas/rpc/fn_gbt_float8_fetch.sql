-- Function: public.gbt_float8_fetch(internal)
CREATE OR REPLACE FUNCTION public.gbt_float8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_fetch$function$
;

-- COMMENT ON FUNCTION public.gbt_float8_fetch(internal) IS '_your_comment_here_';

