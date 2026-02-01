-- Function: public.int8_dist(bigint, bigint)
CREATE OR REPLACE FUNCTION public.int8_dist(bigint, bigint)
 RETURNS bigint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int8_dist$function$
;

-- COMMENT ON FUNCTION public.int8_dist(bigint, bigint) IS '_your_comment_here_';

