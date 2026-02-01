-- Function: public.gbtreekey2_out(gbtreekey2)
CREATE OR REPLACE FUNCTION public.gbtreekey2_out(gbtreekey2)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$
;

-- COMMENT ON FUNCTION public.gbtreekey2_out(gbtreekey2) IS '_your_comment_here_';

