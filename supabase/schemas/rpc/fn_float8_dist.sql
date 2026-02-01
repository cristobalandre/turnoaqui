-- Function: public.float8_dist(double precision, double precision)
CREATE OR REPLACE FUNCTION public.float8_dist(double precision, double precision)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float8_dist$function$
;

-- COMMENT ON FUNCTION public.float8_dist(double precision, double precision) IS '_your_comment_here_';

