import { supabase } from "./supabaseClient";

export async function getDefaultOrgId() {
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data?.id) {
    throw new Error("No se encontró ninguna organización (organizations).");
  }

  return data.id;
}
