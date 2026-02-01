-- Function: public.interval_dist(interval, interval)
CREATE OR REPLACE FUNCTION public.interval_dist(interval, interval)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$interval_dist$function$
;

-- COMMENT ON FUNCTION public.interval_dist(interval, interval) IS '_your_comment_here_';

