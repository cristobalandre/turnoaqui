-- Function: public.time_dist(time without time zone, time without time zone)
CREATE OR REPLACE FUNCTION public.time_dist(time without time zone, time without time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$time_dist$function$
;

-- COMMENT ON FUNCTION public.time_dist(time without time zone, time without time zone) IS '_your_comment_here_';

