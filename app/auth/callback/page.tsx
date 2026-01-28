"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Finalizando validación...");

  // Inicializamos Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. ESTRATEGIA PRINCIPAL: Escuchar al cliente de Supabase
    // Él es capaz de leer el Hash de la URL (#access_token) automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        setMsg("✅ ¡Verificado! Entrando al sistema...");
        // Pequeña pausa para ver el check verde
        setTimeout(() => {
          router.refresh();
          router.push("/dashboard");
        }, 800);
      }
    });

    // 2. ESTRATEGIA SECUNDARIA: Canje manual de Código (para correos)
    const handleCode = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const error_description = searchParams.get("error_description");

      if (error) {
        setMsg(`❌ Error: ${error_description || "Error desconocido"}`);
        return;
      }

      // Solo intentamos canjear si hay código explícito y no tenemos sesión aún
      if (code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionError) {
          setMsg(`❌ Error de sesión: ${sessionError.message}`);
        }
      }
    };

    handleCode();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      {msg.includes("❌") ? (
         <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-2xl font-bold">!</div>
      ) : msg.includes("✅") ? (
         <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">✓</div>
      ) : (
         <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      )}
      
      <p className={`text-sm font-medium ${msg.includes("Error") ? "text-red-400" : "text-gray-200"}`}>
        {msg}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F1112] text-white">
      <Suspense fallback={<div className="text-zinc-500 text-sm">Cargando...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}