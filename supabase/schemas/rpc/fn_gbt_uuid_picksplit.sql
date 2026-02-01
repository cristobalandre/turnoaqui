-- Function: public.gbt_uuid_picksplit(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_uuid_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_picksplit$function$
;

-- COMMENT ON FUNCTION public.gbt_uuid_picksplit(internal, internal) IS '_your_comment_here_';

