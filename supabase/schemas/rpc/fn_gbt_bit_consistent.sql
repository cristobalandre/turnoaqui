-- Function: public.gbt_bit_consistent(internal, bit, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal) IS '_your_comment_here_';

