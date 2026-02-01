-- Function: public.gbtreekey_var_out(gbtreekey_var)
CREATE OR REPLACE FUNCTION public.gbtreekey_var_out(gbtreekey_var)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$
;

-- COMMENT ON FUNCTION public.gbtreekey_var_out(gbtreekey_var) IS '_your_comment_here_';

