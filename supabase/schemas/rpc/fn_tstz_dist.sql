-- Function: public.tstz_dist(timestamp with time zone, timestamp with time zone)
CREATE OR REPLACE FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$tstz_dist$function$
;

-- COMMENT ON FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone) IS '_your_comment_here_';

