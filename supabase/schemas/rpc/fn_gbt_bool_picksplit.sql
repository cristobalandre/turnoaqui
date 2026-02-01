-- Function: public.gbt_bool_picksplit(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_picksplit$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_picksplit(internal, internal) IS '_your_comment_here_';

