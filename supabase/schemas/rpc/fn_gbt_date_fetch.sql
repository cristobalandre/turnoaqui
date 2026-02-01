-- Function: public.gbt_date_fetch(internal)
CREATE OR REPLACE FUNCTION public.gbt_date_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_fetch$function$
;

-- COMMENT ON FUNCTION public.gbt_date_fetch(internal) IS '_your_comment_here_';

