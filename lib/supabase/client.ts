import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

// MANTENER EL TRUCO DE SEGURIDAD (Bypass Lock)
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
        lock: bypassLock, // ✅ Vital para evitar AbortError
        persistSession: true,
        detectSessionInUrl: true, // 👈 CAMBIO CRÍTICO: Activado para leer el #access_token
        storageKey: 'sb-turnoaqui-auth',
      }
    } as any
  );

  return client;
}