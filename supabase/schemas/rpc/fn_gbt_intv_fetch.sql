-- Function: public.gbt_intv_fetch(internal)
CREATE OR REPLACE FUNCTION public.gbt_intv_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_fetch$function$
;

-- COMMENT ON FUNCTION public.gbt_intv_fetch(internal) IS '_your_comment_here_';

