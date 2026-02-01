-- Function: public.float4_dist(real, real)
CREATE OR REPLACE FUNCTION public.float4_dist(real, real)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float4_dist$function$
;

-- COMMENT ON FUNCTION public.float4_dist(real, real) IS '_your_comment_here_';

