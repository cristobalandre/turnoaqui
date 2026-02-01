-- Function: public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal) IS '_your_comment_here_';

