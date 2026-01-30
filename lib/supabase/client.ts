import { createBrowserClient } from '@supabase/ssr'

// Variable para almacenar la instancia única fuera de la función
let supabaseInstance: any = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
}