-- Function: public.gbtreekey8_out(gbtreekey8)
CREATE OR REPLACE FUNCTION public.gbtreekey8_out(gbtreekey8)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$
;

-- COMMENT ON FUNCTION public.gbtreekey8_out(gbtreekey8) IS '_your_comment_here_';

