"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Verificando tu cuenta...");

  // Creamos el cliente aquí mismo para evitar dependencias rotas
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Buscamos el código que viene en el link del correo
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const error_description = searchParams.get("error_description");

      if (error) {
        setMsg(`❌ Error: ${error_description || "No se pudo verificar."}`);
        return;
      }

      if (code) {
        // 2. Intercambiamos ese código por una sesión válida
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (!sessionError) {
          // 3. ¡Éxito! Refrescamos y vamos al Dashboard
          setMsg("✅ ¡Cuenta verificada! Entrando...");
          
          // Un pequeño delay para que el usuario vea el check verde
          setTimeout(() => {
            router.refresh();
            router.push("/dashboard");
          }, 1000);
        } else {
          setMsg(`❌ Error de sesión: ${sessionError.message}`);
        }
      } else {
        // Si entra aquí sin código, lo mandamos al login
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, router, supabase.auth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F1112] text-white">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        {msg.includes("❌") ? (
           // Icono Error
           <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-2xl font-bold">
             !
           </div>
        ) : msg.includes("✅") ? (
           // Icono Éxito
           <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">
             ✓
           </div>
        ) : (
           // Icono Cargando
           <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        )}
        
        <p className={`text-sm font-medium ${msg.includes("Error") ? "text-red-400" : "text-gray-200"}`}>
          {msg}
        </p>
      </div>
    </div>
  );
}