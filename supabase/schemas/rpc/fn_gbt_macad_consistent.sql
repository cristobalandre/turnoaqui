-- Function: public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal) IS '_your_comment_here_';

