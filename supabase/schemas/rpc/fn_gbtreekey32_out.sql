-- Function: public.gbtreekey32_out(gbtreekey32)
CREATE OR REPLACE FUNCTION public.gbtreekey32_out(gbtreekey32)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$
;

-- COMMENT ON FUNCTION public.gbtreekey32_out(gbtreekey32) IS '_your_comment_here_';

