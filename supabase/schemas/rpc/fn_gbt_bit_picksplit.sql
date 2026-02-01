-- Function: public.gbt_bit_picksplit(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_bit_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_picksplit$function$
;

-- COMMENT ON FUNCTION public.gbt_bit_picksplit(internal, internal) IS '_your_comment_here_';

