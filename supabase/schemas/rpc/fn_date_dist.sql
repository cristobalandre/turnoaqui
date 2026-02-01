-- Function: public.date_dist(date, date)
CREATE OR REPLACE FUNCTION public.date_dist(date, date)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$date_dist$function$
;

-- COMMENT ON FUNCTION public.date_dist(date, date) IS '_your_comment_here_';

