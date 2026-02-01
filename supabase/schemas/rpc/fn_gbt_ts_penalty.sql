-- Function: public.gbt_ts_penalty(internal, internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_ts_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_penalty$function$
;

-- COMMENT ON FUNCTION public.gbt_ts_penalty(internal, internal, internal) IS '_your_comment_here_';

