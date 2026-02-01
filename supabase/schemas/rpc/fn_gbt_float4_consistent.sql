-- Function: public.gbt_float4_consistent(internal, real, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal) IS '_your_comment_here_';

