import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // 🗑️ Borramos la configuración 'lock' que daba error.
        // El Dashboard ya está protegido contra el AbortError internamente.
        
        // Evita conflictos con el Middleware al leer la URL
        detectSessionInUrl: false, 
        
        // Mantiene la sesión activa
        persistSession: true,
        
        // Almacenamiento seguro en localStorage
        storageKey: 'sb-turnoaqui-auth',
      }
    }
  );

  return client;
}