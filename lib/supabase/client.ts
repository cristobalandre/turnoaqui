import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

// 🔓 LA SOLUCIÓN MAGICA:
// Esta función reemplaza al sistema de bloqueo del navegador.
// En lugar de esperar y fallar (AbortError), ejecuta la tarea inmediatamente.
const envLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Aquí inyectamos nuestra función "anti-bloqueo"
        lock: envLock,
        
        // Configuraciones estándar para que no choque con el middleware
        detectSessionInUrl: false, 
        persistSession: true,
        storageKey: 'sb-turnoaqui-auth',
      }
    }
  );

  return client;
}