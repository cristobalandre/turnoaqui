-- Function: public.gbt_bit_same(gbtreekey_var, gbtreekey_var, internal)
CREATE OR REPLACE FUNCTION public.gbt_bit_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_same$function$
;

-- COMMENT ON FUNCTION public.gbt_bit_same(gbtreekey_var, gbtreekey_var, internal) IS '_your_comment_here_';

