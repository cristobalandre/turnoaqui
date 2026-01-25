"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestSupabasePage() {
  const [msg, setMsg] = useState("Probando Supabase...");

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.getSession();
      if (error) setMsg("Error ❌ " + error.message);
      else setMsg("Supabase OK ✅ conectado");
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Test Supabase</h1>
      <p>{msg}</p>
    </div>
  );
}
