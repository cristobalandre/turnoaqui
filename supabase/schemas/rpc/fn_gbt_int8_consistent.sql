-- Function: public.gbt_int8_consistent(internal, bigint, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal) IS '_your_comment_here_';

