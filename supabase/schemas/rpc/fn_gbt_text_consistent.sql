-- Function: public.gbt_text_consistent(internal, text, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal) IS '_your_comment_here_';

