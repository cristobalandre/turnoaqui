-- Function: public.int2_dist(smallint, smallint)
CREATE OR REPLACE FUNCTION public.int2_dist(smallint, smallint)
 RETURNS smallint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int2_dist$function$
;

-- COMMENT ON FUNCTION public.int2_dist(smallint, smallint) IS '_your_comment_here_';

