-- Function: public.gbt_enum_fetch(internal)
CREATE OR REPLACE FUNCTION public.gbt_enum_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_fetch$function$
;

-- COMMENT ON FUNCTION public.gbt_enum_fetch(internal) IS '_your_comment_here_';

