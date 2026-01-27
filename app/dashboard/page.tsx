"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Outfit } from "next/font/google";
import { 
  Calendar, Globe, Inbox, Scissors, Users, Package, Lock, Loader2 
} from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null); // Guardamos datos del perfil (pago)
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getData = async () => {
      // 1. Obtenemos el usuario de Google/Email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // 2. Buscamos su "Ficha de Cliente" en la tabla profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setProfile(profileData);
      }
      setLoading(false);
    };
    getData();
  }, []);

  // PANTALLA DE CARGA
  if (loading) return (
    <div className={`flex min-h-screen items-center justify-center bg-[#0F1112] text-white ${outfit.className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  // ⛔ CANDADO DE SEGURIDAD: Si no existe perfil o el plan no es 'active'
  if (!profile || profile.plan_status !== 'active') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-[#0F1112] text-white p-6 text-center ${outfit.className}`}>
        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Acceso Restringido</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Hola {user?.email}. Tu cuenta ha sido creada correctamente, pero aún no tienes una suscripción activa para gestionar el estudio.
        </p>
        <div className="flex gap-4">
            <Link href="/" className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm">
                Volver al inicio
            </Link>
            <a href="mailto:soporte@tustudio.com" className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm shadow-lg shadow-emerald-900/20">
                Contactar Soporte
            </a>
        </div>
      </div>
    );
  }

  // ✅ SI EL PLAN ESTÁ ACTIVO, MOSTRAMOS EL DASHBOARD COMPLETO
  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 bg-gray-100 dark:bg-[#09090b] ${outfit.className}`}>
      
      {/* FONDO DINÁMICO */}
      <div className="absolute top-0 right-0 w-[85%] h-full bg-cover bg-center opacity-40 pointer-events-none transition-all duration-500
        bg-[url('/login-bg-light.png')] mix-blend-multiply 
        dark:bg-[url('/login-bg-dark.png')] dark:mix-blend-screen"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 100%)", 
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 100%)",
        }} 
      />

      <div className="relative z-10 h-full w-full overflow-y-auto">
        {/* ENCABEZADO */}
        <div className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#09090b]/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Plan Activo
                  </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* ... AQUÍ SIGUE EL RESTO DE TU CÓDIGO DEL GRID DE TARJETAS (Inbox, Calendar, etc) ... 
            (El código de las tarjetas es el mismo que ya tenías, ¿quieres que te lo pegue completo o lo tienes?)
        */}
        <main className="mx-auto max-w-6xl p-6">
            {/* aquí va el Grid de tarjetas */}
             <div className="grid gap-6 md:grid-cols-3">
              {/* Tarjeta 1 */}
              <Link href="/requests" className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white/70 backdrop-blur-md dark:bg-zinc-900/60 dark:border-white/10">
                <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500 transition-all group-hover:w-1.5"></div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="p-2.5 bg-yellow-50 rounded-lg dark:bg-yellow-500/10"><Inbox className="h-5 w-5 text-yellow-600 dark:text-yellow-500" /></div>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Solicitudes Web</h3>
              </Link>
              {/* Tarjeta 2 */}
              <Link href="/calendar" className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white/70 backdrop-blur-md dark:bg-zinc-900/60 dark:border-white/10">
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 transition-all group-hover:w-1.5"></div>
                <div className="mb-4 flex items-center justify-between">
                   <div className="p-2.5 bg-blue-50 rounded-lg dark:bg-blue-500/10"><Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" /></div>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Agenda Principal</h3>
              </Link>
              {/* Tarjeta 3 */}
              <Link href="/booking" target="_blank" className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white/70 backdrop-blur-md dark:bg-zinc-900/60 dark:border-white/10">
                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500 transition-all group-hover:w-1.5"></div>
                <div className="mb-4 flex items-center justify-between">
                   <div className="p-2.5 bg-emerald-50 rounded-lg dark:bg-emerald-500/10"><Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /></div>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Ir al Sitio Web</h3>
              </Link>
            </div>
            {/* Links rápidos */}
             <div className="mt-12">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Administración</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Link href="/services" className="flex items-center gap-3 rounded-xl border border-gray-200 shadow-sm p-4 text-sm font-semibold text-gray-600 transition-all bg-white/60 backdrop-blur-sm hover:bg-white hover:text-black dark:border-white/5 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><Scissors className="h-4 w-4" /> Servicios</Link>
                  <Link href="/staff" className="flex items-center gap-3 rounded-xl border border-gray-200 shadow-sm p-4 text-sm font-semibold text-gray-600 transition-all bg-white/60 backdrop-blur-sm hover:bg-white hover:text-black dark:border-white/5 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><Users className="h-4 w-4" /> Staff</Link>
                  <Link href="/resources" className="flex items-center gap-3 rounded-xl border border-gray-200 shadow-sm p-4 text-sm font-semibold text-gray-600 transition-all bg-white/60 backdrop-blur-sm hover:bg-white hover:text-black dark:border-white/5 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><Package className="h-4 w-4" /> Recursos</Link>
                </div>
             </div>
        </main>
      </div>
    </div>
  );
}