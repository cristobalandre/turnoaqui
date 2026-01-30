"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Iniciando motor de autenticación...");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // ------------------------------------------------------------------
        // ESTRATEGIA 1: Detección Automática (Si la librería fue rápida)
        // ------------------------------------------------------------------
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          console.log("Sesión detectada automáticamente.");
          return await finalizeLogin(initialSession.user.id);
        }

        // ------------------------------------------------------------------
        // ESTRATEGIA 2: Extracción Manual del Hash (URL #access_token=) - LA CLAVE 🔑
        // ------------------------------------------------------------------
        // Si la librería falló, nosotros leemos el token directamente del navegador.
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            setMsg("Capturando token manualmente...");
            console.log("Hash detectado, procesando manual...");
            
            // Convertimos el hash en parámetros legibles
            const params = new URLSearchParams(hash.substring(1)); // Quitamos el '#'
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                // Forzamos la sesión en Supabase con los datos que robamos de la URL
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                
                if (error) throw error;
                if (data.session) {
                    console.log("Sesión forzada con éxito.");
                    return await finalizeLogin(data.session.user.id);
                }
            }
        }

        // ------------------------------------------------------------------
        // ESTRATEGIA 3: Código PKCE (URL ?code=) - Respaldo antiguo
        // ------------------------------------------------------------------
        const code = searchParams.get("code");
        if (code) {
          setMsg("Canjeando código de seguridad...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session) return await finalizeLogin(data.session.user.id);
        }

        // ------------------------------------------------------------------
        // ESTRATEGIA 4: Event Listener (Red de seguridad final)
        // ------------------------------------------------------------------
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          if (session) {
            finalizeLogin(session.user.id);
          }
        });

        // Timeout: Si en 6 segundos nada funcionó, nos rendimos.
        setTimeout(async () => {
          const { data: { session: finalCheck } } = await supabase.auth.getSession();
          if (!finalCheck) {
            setError("Tiempo agotado: No se pudo capturar la sesión.");
          }
        }, 6000);

        return () => subscription.unsubscribe();

      } catch (err: any) {
        console.error("Error crítico en callback:", err);
        // Si es un error de red pero tenemos token, intentamos ignorarlo
        if (err.message?.includes("fetch")) {
             router.replace("/dashboard");
        } else {
             setError(err.message || "Error desconocido al procesar entrada");
        }
      }
    };

    const finalizeLogin = async (userId: string) => {
      setMsg("Verificando perfil...");
      try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_status')
            .eq('id', userId)
            .single();

        if (profile?.plan_status === 'active') {
            setMsg("¡Todo listo!");
            router.replace("/dashboard"); 
        } else {
            setMsg("Cuenta en revisión...");
            // Te deja pasar igual para que veas el estado en el dashboard
            setTimeout(() => router.replace("/dashboard"), 1000);
        }
      } catch (e) {
          console.warn("No se pudo leer perfil, pasando al dashboard...", e);
          router.replace("/dashboard");
      }
    };

    handleAuth();
  }, [searchParams, router, supabase]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200">
        <AlertCircle className="w-10 h-10" />
        <p className="text-center text-sm">{error}</p>
        <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors">
          Reintentar Login
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
      <Suspense fallback={<div className="text-zinc-500">Cargando autenticación...</div>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}