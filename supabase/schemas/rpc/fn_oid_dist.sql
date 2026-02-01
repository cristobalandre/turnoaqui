-- Function: public.oid_dist(oid, oid)
CREATE OR REPLACE FUNCTION public.oid_dist(oid, oid)
 RETURNS oid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$oid_dist$function$
;

-- COMMENT ON FUNCTION public.oid_dist(oid, oid) IS '_your_comment_here_';

