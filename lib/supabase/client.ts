import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // CRITICAL FOR VERCEL:
        // Disables the lock system that causes AbortError and timeouts.
        lock: {
          length: 0, 
        },
        // Prevents conflicts with Middleware when reading URL
        detectSessionInUrl: false, 
        persistSession: true,
        // Safe storage in localStorage
        storageKey: 'sb-turnoaqui-auth',
      }
    }
  );

  return client;
}