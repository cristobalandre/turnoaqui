-- Function: public.gbtreekey4_in(cstring)
CREATE OR REPLACE FUNCTION public.gbtreekey4_in(cstring)
 RETURNS gbtreekey4
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$
;

-- COMMENT ON FUNCTION public.gbtreekey4_in(cstring) IS '_your_comment_here_';

