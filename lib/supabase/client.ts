import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

// 🔓 LA LLAVE MAESTRA:
// Esta función engaña a Supabase. En vez de pedir permiso al navegador (que falla),
// le dice "Sí, sí, tienes permiso" y ejecuta todo de inmediato.
async function bypassLock(name: string, timeout: number, func: () => Promise<any>) {
  return await func();
}

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Inyectamos nuestra función de desbloqueo
        lock: bypassLock,
        
        // Configuraciones de seguridad estándar
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-turnoaqui-auth',
      }
    } as any // 👈 EL TRUCO: Obligamos a TypeScript a aceptar nuestra configuración
  );

  return client;
}