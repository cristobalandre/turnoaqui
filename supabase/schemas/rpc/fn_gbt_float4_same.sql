-- Function: public.gbt_float4_same(gbtreekey8, gbtreekey8, internal)
CREATE OR REPLACE FUNCTION public.gbt_float4_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_same$function$
;

-- COMMENT ON FUNCTION public.gbt_float4_same(gbtreekey8, gbtreekey8, internal) IS '_your_comment_here_';

