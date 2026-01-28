"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Verificando permisos...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Función para decidir a dónde mandar al usuario
    const checkUserStatusAndRedirect = async (userId: string) => {
      try {
        // Consultamos el estado en la tabla profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan_status')
          .eq('id', userId)
          .single();

        if (error || !profile) {
          console.error("Error leyendo perfil:", error);
          // Por seguridad, si falla, al Home
          router.push("/");
          return;
        }

        if (profile.plan_status === 'active') {
          setMsg("✅ Cuenta Activa. Entrando...");
          setTimeout(() => router.push("/dashboard"), 800);
        } else {
          setMsg("🔒 Cuenta en Revisión. Redirigiendo...");
          // Si está pending, lo mandamos al Home para que vea el candado
          setTimeout(() => router.push("/"), 1500);
        }

      } catch (err) {
        router.push("/");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // Apenas detectamos sesión, revisamos el estado
        await checkUserStatusAndRedirect(session!.user.id);
      }
    });

    // Manejo de código manual (por si acaso)
    const handleCode = async () => {
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await checkUserStatusAndRedirect(data.session.user.id);
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
      {msg.includes("🔒") ? (
         <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-2xl font-bold">🔒</div>
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