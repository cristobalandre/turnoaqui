"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, LogOut, User as UserIcon, RefreshCw, 
  LayoutGrid, Calendar, Music4, Box, Users, 
  Settings, Zap, ArrowRight 
} from "lucide-react";

// ✅ CLIENTE SINGLETON (Tu motor blindado)
const supabase = createClient();

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Conectando...");
  const router = useRouter();

  // --- LÓGICA DE CONEXIÓN ROBUSTA (NO TOCAR) ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Detector de error de reloj (Clock Skew)
          if (error.message.includes("future") || error.message.includes("skew")) {
            if (retryCount < 3) {
              setStatusMsg(`Sincronizando reloj (${retryCount + 1}/3)...`);
              setTimeout(() => { if (mounted) setRetryCount(p => p + 1); }, 2000);
              return;
            }
          }
          throw error;
        }

        if (!session) {
          if (mounted) router.replace("/login");
          return;
        }

        // Cargar perfil
        setStatusMsg("Cargando tu estudio...");
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          if (data) setProfile(data);
          setLoading(false);
        }

      } catch (err: any) {
        // Ignorar ruido de red en Vercel
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) return;
        console.error("Error crítico:", err);
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [router, retryCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  // --- PANTALLA DE CARGA ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          {retryCount > 0 && <RefreshCw className="w-4 h-4 text-emerald-500 absolute inset-0 m-auto animate-pulse" />}
        </div>
        <p className="text-zinc-400 text-sm animate-pulse">{statusMsg}</p>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">T</div>
            <span className="font-bold text-xl tracking-tight">TurnoAquí</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-medium text-zinc-500 hidden md:block">v2.5 Stable</span>
             <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- HEADER --- */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Hola, {profile?.full_name?.split(' ')[0] || 'Productor'}.
            </h1>
            <p className="text-zinc-500">Todo listo para gestionar tu estudio hoy.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
            <div className={`w-2 h-2 rounded-full ${profile?.plan_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-medium text-zinc-400">
              Estado: {profile?.plan_status === 'active' ? 'Sistema Operativo' : 'Verificando'}
            </span>
          </div>
        </header>
        
        {/* --- GRID PRINCIPAL (Geminizado) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* 1. STUDIO HUB */}
          <Link href="/studio" className="col-span-1 md:col-span-2 lg:col-span-2 group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><LayoutGrid className="w-32 h-32" /></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><LayoutGrid className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold">Studio Hub</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 max-w-sm">
                Panel central de control. Gestiona salas, reservas activas y métricas en tiempo real.
              </p>
              <div className="flex items-center text-emerald-500 text-sm font-medium gap-1 group-hover:gap-2 transition-all">
                Entrar al Hub <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* 2. CALENDAR */}
          <Link href="/calendar" className="group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Calendar className="w-6 h-6" /></div>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Hoy</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Calendario</h3>
              <p className="text-zinc-500 text-xs">Ver agenda semanal.</p>
            </div>
          </Link>

          {/* 3. PROJECTS */}
          <Link href="/projects" className="group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Music4 className="w-6 h-6" /></div>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Archivos</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Proyectos</h3>
              <p className="text-zinc-500 text-xs">Gestión de versiones.</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* 4. RESOURCES */}
           <Link href="/resources" className="group">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
               <div className="flex items-center gap-3 mb-2">
                 <Box className="w-5 h-5 text-orange-500" />
                 <h3 className="font-semibold text-zinc-200">Recursos</h3>
               </div>
               <p className="text-xs text-zinc-500">Inventario y equipos.</p>
            </div>
           </Link>

           {/* 5. STAFF / TEAM */}
           <Link href="/team" className="group">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
               <div className="flex items-center gap-3 mb-2">
                 <Users className="w-5 h-5 text-pink-500" />
                 <h3 className="font-semibold text-zinc-200">Staff</h3>
               </div>
               <p className="text-xs text-zinc-500">Productores y permisos.</p>
            </div>
           </Link>

           {/* 6. SETTINGS */}
           <Link href="/settings" className="group">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
               <div className="flex items-center gap-3 mb-2">
                 <Settings className="w-5 h-5 text-zinc-400" />
                 <h3 className="font-semibold text-zinc-200">Ajustes</h3>
               </div>
               <p className="text-xs text-zinc-500">Configuración general.</p>
            </div>
           </Link>
        </div>

        {/* --- TARJETA ADMIN (Solo visible para Admins) --- */}
        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Zona de Peligro</h2>
            <Link href="/admin/team">
              <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 hover:border-amber-500/50 transition-all cursor-pointer overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield className="w-24 h-24 text-amber-500" /></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-500 group-hover:text-amber-400 transition-colors">Panel Super Admin</h3>
                    <p className="text-zinc-500 text-sm">Control total de base de datos, usuarios y facturación.</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}