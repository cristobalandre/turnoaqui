"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

// 1. COMPONENTE INTERNO: Maneja la lógica de Supabase y URL
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 👈 Esto es lo que pedía Suspense
  const [msg, setMsg] = useState("Verificando tu cuenta...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const error_description = searchParams.get("error_description");

      if (error) {
        setMsg(`❌ Error: ${error_description || "No se pudo verificar."}`);
        return;
      }

      if (code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (!sessionError) {
          setMsg("✅ ¡Cuenta verificada! Entrando...");
          setTimeout(() => {
            router.refresh();
            router.push("/dashboard");
          }, 1000);
        } else {
          setMsg(`❌ Error de sesión: ${sessionError.message}`);
        }
      } else {
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, router, supabase.auth]);

  // UI del componente interno
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

// 2. COMPONENTE PRINCIPAL: Envuelve todo en Suspense
export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F1112] text-white">
      <Suspense fallback={
        // UI de carga mientras Next.js lee la URL
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
           <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
           <p className="text-sm font-medium text-gray-200">Cargando verificación...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}