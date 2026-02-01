-- Function: public.gbt_bool_consistent(internal, boolean, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal) IS '_your_comment_here_';

