import { createClient as createNewClient } from "@/lib/supabase/client";

// ✅ Reutilizamos la instancia única del cliente moderno
const client = createNewClient();

// Exportamos 'supabase' para que los archivos viejos (como org.ts) sigan funcionando
export const supabase = client;

// Exportamos la función auxiliar por si acaso
export function getSupabase() {
  return client;
}