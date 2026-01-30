// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // CRÍTICO PARA VERCEL:
        // Desactiva el sistema de bloqueo que causa el 'AbortError' y tiempos de espera.
        lock: {
          length: 0, 
        },
        // Evita conflictos con el Middleware al leer la URL
        detectSessionInUrl: false, 
        persistSession: true,
        // Almacenamiento seguro en localStorage
        storageKey: 'sb-turnoaqui-auth',
      }
    }
  );

  return client;
}