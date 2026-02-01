-- Function: public.gbtreekey32_in(cstring)
CREATE OR REPLACE FUNCTION public.gbtreekey32_in(cstring)
 RETURNS gbtreekey32
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$
;

-- COMMENT ON FUNCTION public.gbtreekey32_in(cstring) IS '_your_comment_here_';

