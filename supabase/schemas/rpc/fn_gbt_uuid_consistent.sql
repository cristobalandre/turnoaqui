-- Function: public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal)
CREATE OR REPLACE FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_consistent$function$
;

-- COMMENT ON FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal) IS '_your_comment_here_';

