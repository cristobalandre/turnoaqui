"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// 🚨 CAMBIO CLAVE: Usamos TU cliente modificado, no el genérico
import { createClient } from "@/lib/supabase/client"; 
import { Loader2, AlertCircle } from "lucide-react";

// Componente interno que usa useSearchParams
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Verificando credenciales...");
  const [error, setError] = useState<string | null>(null);

  // Usamos el cliente singleton que tiene el parche del candado
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        
        if (!code) {
          // Si no hay código, quizás ya tenemos sesión o es un error
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.push("/dashboard");
          } else {
            setError("No se recibió código de autenticación.");
            setTimeout(() => router.push("/login"), 3000);
          }
          return;
        }

        setMsg("Intercambiando token...");
        // Canjeamos el código por sesión
        const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (authError) throw authError;

        // Verificamos perfil
        setMsg("Validando perfil...");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan_status')
            .eq('id', user.id)
            .single();

          if (profile?.plan_status === 'active') {
            setMsg("✅ Todo listo. Entrando...");
            router.push("/dashboard");
          } else {
            setMsg("⚠️ Cuenta en revisión o incompleta.");
            setTimeout(() => router.push("/dashboard"), 1500); // Dejar pasar igual para que vea su estado
          }
        }

      } catch (err: any) {
        console.error("Error crítico en callback:", err);
        // Si es el famoso AbortError, lo ignoramos y probamos entrar igual
        if (err.name === 'AbortError') {
           console.warn("AbortError ignorado, forzando entrada...");
           router.push("/dashboard");
           return;
        }
        setError(err.message || "Error desconocido al iniciar sesión");
      }
    };

    handleCallback();
  }, [searchParams, router, supabase]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200">
        <AlertCircle className="w-10 h-10" />
        <p className="text-center text-sm">{error}</p>
        <button onClick={() => router.push("/login")} className="px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors">
          Volver al Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      <p className="text-sm font-medium text-zinc-300 animate-pulse">{msg}</p>
    </div>
  );
}

// Componente Principal con Suspense (Requisito de Next.js para useSearchParams)
export default function CallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white">
      <Suspense fallback={<div className="text-zinc-500">Cargando autenticación...</div>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}