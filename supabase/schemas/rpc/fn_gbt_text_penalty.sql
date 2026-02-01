-- Function: public.gbt_text_penalty(internal, internal, internal)
CREATE OR REPLACE FUNCTION public.gbt_text_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_penalty$function$
;

-- COMMENT ON FUNCTION public.gbt_text_penalty(internal, internal, internal) IS '_your_comment_here_';

