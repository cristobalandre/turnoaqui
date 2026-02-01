-- Function: public.gbt_uuid_union(internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_uuid_union(internal, internal)
 RETURNS gbtreekey32
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_union$function$
;

-- COMMENT ON FUNCTION public.gbt_uuid_union(internal, internal) IS '_your_comment_here_';

