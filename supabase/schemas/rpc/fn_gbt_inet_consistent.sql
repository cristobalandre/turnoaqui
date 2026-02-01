-- Function: public.gbt_inet_consistent(internal, inet, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal) IS '_your_comment_here_';

