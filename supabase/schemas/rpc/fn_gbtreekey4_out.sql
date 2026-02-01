-- Function: public.gbtreekey4_out(gbtreekey4)
CREATE OR REPLACE FUNCTION public.gbtreekey4_out(gbtreekey4)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$
;

-- COMMENT ON FUNCTION public.gbtreekey4_out(gbtreekey4) IS '_your_comment_here_';

