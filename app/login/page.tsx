"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
// 🔴 CAMBIO CLAVE: Usamos la librería correcta para Next.js App Router
import { createBrowserClient } from "@supabase/ssr"; 
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  
  // ✅ CREACIÓN CORRECTA DEL CLIENTE
  // Este cliente guarda los tokens en COOKIES, no en LocalStorage.
  // Así el servidor (route.ts) podrá validarlos.
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const onGoogleLogin = async () => {
    setLoading(true);
    // Usamos location.origin para asegurar que detecta si es localhost o vercel
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      setMsg({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setMsg(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMsg({ type: 'error', text: error.message });
      } else {
        setMsg({ type: 'success', text: "¡Cuenta creada! Revisa tu correo para confirmar." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg({ type: 'error', text: "Credenciales incorrectas o usuario no encontrado." });
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0F1112] text-gray-100 ${outfit.className}`}>
      
      {/* BOTÓN VOLVER AL INICIO */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      {/* FONDO AMBIENTAL */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
            <Logo widthClass="w-64 md:w-96" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {isSignUp ? "Crea tu cuenta de estudio" : "Bienvenido de nuevo"}
          </h2>
          <p className="text-sm text-zinc-400">
            {isSignUp ? "Gestiona tus sesiones sin ruido visual." : "Tu consola de operaciones te espera."}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/50">
          
          <button
            onClick={onGoogleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-black transition-all hover:bg-emerald-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>Continuar con Google</span>
          </button>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink-0 px-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">o con correo</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@estudio.com"
                type="email"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña segura"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {msg && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-bold text-center border animate-in fade-in slide-in-from-top-1 ${
              msg.type === 'success'
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {msg.text}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase transition-all bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Procesando..." : (isSignUp ? "Crear Cuenta" : "Ingresar")}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMsg(null); }}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? (
                <>¿Ya tienes cuenta? <span className="font-bold underline decoration-emerald-500/50 underline-offset-4">Inicia sesión</span></>
              ) : (
                <>¿Nuevo en TurnoAquí? <span className="font-bold underline decoration-emerald-500/50 underline-offset-4">Regístrate gratis</span></>
              )}
            </button>
          </div>

        </div>

        <p className="mt-8 text-center text-[10px] text-zinc-700 uppercase tracking-widest">
          TurnoAquí © 2026
        </p>

      </div>
    </div>
  );
}