-- Function: public.gbt_bpchar_consistent(internal, character, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bpchar_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal) IS '_your_comment_here_';

