-- Function: public.int4_dist(integer, integer)
CREATE OR REPLACE FUNCTION public.int4_dist(integer, integer)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int4_dist$function$
;

-- COMMENT ON FUNCTION public.int4_dist(integer, integer) IS '_your_comment_here_';

