-- Function: public.ts_dist(timestamp without time zone, timestamp without time zone)
CREATE OR REPLACE FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$ts_dist$function$
;

-- COMMENT ON FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone) IS '_your_comment_here_';

