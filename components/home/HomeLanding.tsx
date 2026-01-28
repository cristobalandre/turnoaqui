"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { ArrowRight, LogOut, Chrome, Lock, LayoutDashboard } from "lucide-react"; 
import { Logo } from "@/components/ui/Logo";
// ✅ CORRECCIÓN: Usamos la librería estándar para evitar errores de compilación
import { createClient } from "@supabase/supabase-js";

const outfit = Outfit({ subsets: ["latin"] });

// 🖼️ IMÁGENES DE FONDO
const HERO_IMAGES = [
  "/fondo1.png", 
  "/fondo2.png",
  "/fondo3.png"
];

export default function HomeLanding() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 🔐 ESTADOS DE SUPABASE
  const [user, setUser] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>(""); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ INICIALIZACIÓN DIRECTA (Más segura para evitar errores de versiones)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const router = useRouter();

  // 1. Carrusel de Fondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  // 2. 🛡️ VERIFICAR SESIÓN
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_status, full_name')
          .eq('id', session.user.id)
          .single();

        if (profile) {
            setUserName(profile.full_name || session.user.user_metadata?.full_name || 'Usuario');
            
            if (profile.plan_status === 'active') { 
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } else {
            setIsAuthorized(false);
            setUserName(session.user.user_metadata?.full_name || 'Usuario');
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);


  // 3. 🚀 LOGIN CON GOOGLE
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  // 4. 🚪 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthorized(false);
    router.refresh();
  };

  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 selection:bg-emerald-500/30 ${outfit.className} overflow-x-hidden relative`}>
      
      <div className="fixed inset-0 z-0">
        {HERO_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/50" />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full opacity-60" />
      </div>

      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0F1112]/60 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo size="text-4xl" />
          </div>

          <div className="flex items-center gap-6">
            {!loading && user ? (
              <div className={`flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500`}>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${isAuthorized ? 'text-emerald-500' : 'text-yellow-500'}`}>
                    {isAuthorized ? 'Consola Activa' : 'Pago Pendiente'}
                  </span>
                  <span className="text-sm font-medium text-gray-200">
                    ¿Qué haremos hoy, <span className="text-emerald-400 capitalize">{userName.split(' ')[0]}</span>?
                  </span>
                </div>

                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                   {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-black shadow-lg shadow-emerald-500/20" />
                   ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 ring-2 ring-black">
                          {userName.charAt(0).toUpperCase()}
                      </div>
                   )}
                   
                   <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-colors" title="Cerrar Sesión">
                     <LogOut className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
                  <a href="#features" className="hover:text-emerald-400 transition-colors">Características</a>
                  <a href="#security" className="hover:text-emerald-400 transition-colors">Seguridad</a>
                </div>

                <div className="flex items-center gap-3">
                   <button onClick={handleLogin} className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white group" title="Ingresar con Google">
                      <Chrome className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                   </button>

                   <button onClick={handleLogin} className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
                    <span>Ingresar</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        <div className="mb-8 flex justify-center">
          {user ? (
             isAuthorized ? (
               <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md animate-in fade-in zoom-in duration-500">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 Sistema Operativo Online
               </div>
             ) : (
               <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-1.5 text-xs font-bold text-yellow-400 backdrop-blur-md animate-in fade-in zoom-in duration-500">
                 <Lock className="w-3 h-3" />
                 Acceso Restringido - Contacta al Admin
               </div>
             )
          ) : (
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                TurnoAquí v1.0 - Consola de Operaciones
            </div>
          )}
        </div>

        <div className="mb-8 drop-shadow-2xl">
           <Logo size="text-6xl md:text-8xl" />
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl mb-8 leading-[1.1] drop-shadow-lg transition-all duration-500">
          {user ? (
            <span className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              Bienvenido de vuelta, <br/> 
              <span className="text-emerald-400 capitalize">{userName}.</span>
            </span>
          ) : (
            <span>
              Gestiona tu estudio <br />
              <span className="text-gray-400">sin ruido visual.</span>
            </span>
          )}
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          {user ? (
            isAuthorized ? (
              <Link 
                href="/dashboard" 
                className="h-14 px-10 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest hover:scale-105 active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir al Dashboard
              </Link>
            ) : (
              <button 
                disabled
                className="h-14 px-10 rounded-2xl bg-white/5 text-zinc-500 font-bold flex items-center justify-center gap-2 cursor-not-allowed uppercase text-xs tracking-widest border border-white/10"
              >
                <Lock className="w-3 h-3" />
                Cuenta en Revisión
              </button>
            )
          ) : (
            <button 
              onClick={handleLogin}
              className="h-14 px-10 rounded-2xl bg-white text-black font-black flex items-center justify-center hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest hover:scale-105 active:scale-95"
            >
              Entrar a la Consola
            </button>
          )}
        </div>
      </main>
    </div>
  );
}