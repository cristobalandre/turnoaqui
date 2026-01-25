import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ✅ Vercel/Next-safe Supabase client:
 * - NO crea el cliente al importar el módulo (evita crash en build/prerender)
 * - Exporta `supabase` (compatibilidad con tus imports actuales)
 * - También exporta `getSupabase()` por si quieres usarlo explícitamente
 */

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Mensaje similar al que tira Supabase para que sea fácil de identificar
    throw new Error("supabaseUrl is required.");
  }

  _client = createClient(url, anonKey);
  return _client;
}

/**
 * `supabase` es un Proxy: no toca env vars hasta que realmente lo uses.
 * Así Next/Vercel no revienta al prerender.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    // @ts-expect-error - acceso dinámico a propiedades del cliente
    return client[prop];
  },
});
