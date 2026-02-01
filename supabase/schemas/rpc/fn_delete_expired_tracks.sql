-- Function: public.delete_expired_tracks()
CREATE OR REPLACE FUNCTION public.delete_expired_tracks()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  -- Borra versiones creadas hace más de 3 días
  delete from public.project_versions
  where created_at < now() - interval '3 days';
  
  -- NOTA: Esto borra el registro de la base de datos.
  -- Para borrar el archivo físico del Storage, necesitas un "Trigger" de Supabase
  -- o configurar una política de ciclo de vida (Bucket Lifecycle) si usas S3 directo.
end;
$function$
;

-- COMMENT ON FUNCTION public.delete_expired_tracks() IS '_your_comment_here_';

