"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Procesando acceso...");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // 1. Damos un respiro para que el cliente lea el hash (#access_token)
        // Esto es automático cuando detectSessionInUrl es true.
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          return await finalizeLogin(initialSession.user.id);
        }

        // 2. Si no hay sesión automática, buscamos el código PKCE (?code=)
        const code = searchParams.get("code");
        if (code) {
          setMsg("Canjeando código de seguridad...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session) return await finalizeLogin(data.session.user.id);
        }

        // 3. Si no hay ni hash ni código, esperamos un evento de Auth (último recurso)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            finalizeLogin(session.user.id);
          }
        });

        // Timeout de seguridad si nada funciona en 4 segundos
        setTimeout(async () => {
          const { data: { session: finalCheck } } = await supabase.auth.getSession();
          if (!finalCheck) {
            setError("No se pudo detectar ninguna credencial de acceso.");
          }
        }, 4000);

        return () => subscription.unsubscribe();

      } catch (err: any) {
        console.error("Error en callback:", err);
        setError(err.message || "Error al procesar la entrada");
      }
    };

    const finalizeLogin = async (userId: string) => {
      setMsg("Verificando perfil...");
      // Verificamos si el usuario tiene perfil activo
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_status')
        .eq('id', userId)
        .single();

      if (profile?.plan_status === 'active') {
        setMsg("¡Todo listo!");
        router.replace("/dashboard"); // Usamos replace para no poder volver atrás
      } else {
        setMsg("Cuenta en revisión...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      }
    };

    handleAuth();
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
      {msg === "¡Todo listo!" ? (
        <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
      ) : (
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      )}
      <p className="text-sm font-medium text-zinc-300 animate-pulse">{msg}</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white">
      <Suspense fallback={<div className="text-zinc-500">Cargando...</div>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}