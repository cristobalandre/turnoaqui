// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

// El truco para evitar el AbortError
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
        lock: bypassLock, // <--- ESTO ES VITAL
        persistSession: true,
        detectSessionInUrl: false, // Importante para que no pelee con el callback manual
        storageKey: 'sb-turnoaqui-auth',
      }
    } as any
  );

  return client;
}