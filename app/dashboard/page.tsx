"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, Inbox, Users, Scissors, Package, 
  Settings, ChevronRight, Activity, Info, Zap, LayoutDashboard, LogOut, Music4, Shield 
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter(); 

  useEffect(() => {
    const getData = async () => {
      try {
        // 1. OBTENER SESIÓN DE AUTH (Esto es lo más rápido y seguro)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn("Sesión no válida, redirigiendo...");
          router.replace("/login");
          return;
        }

        setUser(user);

        // 2. INTENTAR CARGAR PERFIL DE DB (Pero no morir si falla)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile(profileData);
        } else {
            console.log("No se leyó perfil de DB, usando datos de Google.");
        }

      } catch (error) {
        console.error("Error general:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut(); 
    window.location.href = "/login";          
  };

  // --- LÓGICA DE VISUALIZACIÓN ROBUSTA ---
  
  // 1. Nombre: Prioridad DB -> Prioridad Google -> Fallback
  const rawMetaData = user?.user_metadata || {};
  const displayName = profile?.full_name?.split(' ')[0] 
    || rawMetaData.full_name?.split(' ')[0] 
    || rawMetaData.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Productor';

  // 2. ¿Es Admin?: Verificamos DB O Verificamos Email directamente (Hardcoded de seguridad)
  // Esto garantiza que TÚ siempre veas el botón, pase lo que pase con la DB.
  const MY_EMAIL = "cristobal.andres.inta@gmail.com"; // TU EMAIL
  const isAdmin = profile?.role === 'admin' || user?.email === MY_EMAIL;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
        <p className="text-xs tracking-widest uppercase animate-pulse">Cargando Estudio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* 🟢 FONDO */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Sistema en Línea</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-400 font-bold">{displayName}</span>.
            </h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Bienvenido a tu consola de operaciones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            
            {/* 🆕 BOTÓN ENTERPRISE (Aparece si eres Admin en DB O si es tu email) */}
            {isAdmin && (
              <Link href="/admin/team">
                <button className="group flex items-center gap-3 px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:border-amber-500/50 hover:bg-zinc-800 transition-all shadow-lg">
                  <div className="p-1.5 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 group-hover:text-amber-500 transition-colors">Enterprise</span>
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Equipo</span>
                  </div>
                </button>
              </Link>
            )}

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/booking`);
                alert("✅ Link copiado");
              }}
              className="group flex items-center gap-3 px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:border-emerald-500/50 hover:bg-zinc-800 transition-all shadow-lg"
            >
              <div className="p-1.5 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-zinc-500 group-hover:text-emerald-400 transition-colors">Link Público</span>
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Copiar</span>
              </div>
            </button>
            
            <button 
              onClick={handleLogout}
              className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all group"
              title="Cerrar Sesión"
            >
                <LogOut className="h-5 w-5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </header>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <SpotlightCard href="/calendar" title="Calendario" subtitle="Agenda" desc="Gestión de horas." icon={<Calendar />} color="emerald" />
          <SpotlightCard href="/projects" title="Studio Hub" subtitle="Mezclas" desc="Gestión de proyectos." icon={<Music4 />} badge="BETA" color="amber" />
          <SpotlightCard href="/requests" title="Solicitudes" subtitle="Entrada" desc="Citas web." icon={<Inbox />} badge="Revisar" color="blue" />
          <SpotlightCard href="/clients" title="Clientes" subtitle="CRM" desc="Base de datos." icon={<Users />} color="purple" />
        </div>

        {/* --- ADMIN LINKS --- */}
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-6 font-black flex items-center gap-3">
             <LayoutDashboard size={14} /> Configuración
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminLink href="/services" title="Servicios" desc="Precios" icon={<Scissors />} />
            <AdminLink href="/staff" title="Staff" desc="Equipo" icon={<Users />} />
            <AdminLink href="/resources" title="Recursos" desc="Salas" icon={<Package />} />
            <AdminLink href="/settings" title="Ajustes" desc="General" icon={<Settings />} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Auxiliares
function SpotlightCard({ href, title, subtitle, desc, icon, badge, color = "emerald" }: any) {
  const colors: any = {
    emerald: "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 text-emerald-400",
    blue: "group-hover:bg-blue-500/10 group-hover:border-blue-500/50 text-blue-400",
    purple: "group-hover:bg-purple-500/10 group-hover:border-purple-500/50 text-purple-400",
    amber: "group-hover:bg-amber-500/10 group-hover:border-amber-500/50 text-amber-400", 
  };
  const iconColor = colors[color] || colors.emerald;
  return (
    <Link href={href} className="group relative bg-[#0F1112] border border-zinc-800 rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
           <div className={`h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center ${iconColor}`}>{icon}</div>
           {badge && <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">{badge}</span>}
        </div>
        <div className="mt-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{subtitle}</p>
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{title}</h3>
          <p className="text-sm text-zinc-400">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
function AdminLink({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-700 transition-all group">
      <div className="h-10 w-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">{icon}</div>
      <div><h4 className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{title}</h4><p className="text-[10px] text-zinc-600 group-hover:text-zinc-500">{desc}</p></div>
    </Link>
  );
}