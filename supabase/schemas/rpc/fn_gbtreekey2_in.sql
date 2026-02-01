-- Function: public.gbtreekey2_in(cstring)
CREATE OR REPLACE FUNCTION public.gbtreekey2_in(cstring)
 RETURNS gbtreekey2
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$
;

-- COMMENT ON FUNCTION public.gbtreekey2_in(cstring) IS '_your_comment_here_';

