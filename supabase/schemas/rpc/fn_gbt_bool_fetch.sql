-- Function: public.gbt_bool_fetch(internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_fetch$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_fetch(internal) IS '_your_comment_here_';

