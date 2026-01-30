"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, Inbox, Users, Scissors, Package, 
  Settings, ChevronRight, Activity, Zap, LayoutDashboard, LogOut, Music4, Shield 
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Instanciamos el cliente
  const supabase = createClient();
  const router = useRouter(); 

  useEffect(() => {
    let isMounted = true; // Bandera para evitar actualizaciones si el componente se desmonta

    // Función auxiliar para cargar el perfil una vez tengamos sesión
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileError) {
            console.error("❌ Error leyendo perfil de DB:", profileError.message);
        }

        if (isMounted) {
            if (profileData) {
                console.log("✅ Perfil cargado desde DB");
                setProfile(profileData);
            } else {
                console.log("ℹ️ No se encontró perfil en DB, usando datos de Google.");
            }
        }

      } catch (error) {
        console.error("💥 Error en fetchProfile:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    console.log("🔄 Iniciando listener de autenticación...");

    // SOLUCIÓN BRAVE: Usamos el listener en lugar de getSession una sola vez
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Evento Auth: ${event}`);

      if (session) {
        // Si hay sesión, procedemos a cargar datos
        if (isMounted) {
             // Solo actualizamos si el usuario cambió para evitar re-renders innecesarios
             setUser((prev: any) => (prev?.id !== session.user.id ? session.user : prev));
             
             // Si aún no hemos cargado el perfil (o cambió el usuario), lo buscamos
             if (loading || user?.id !== session.user.id) {
                 fetchProfile(session.user.id);
             }
        }
      } else if (event === 'SIGNED_OUT' || event === 'o' || !session) {
        // Si no hay sesión y el evento confirma salida o fallo de carga inicial
        // Nota: A veces INITIAL_SESSION viene sin sesión si no hay cookies
        
        // Damos un pequeño margen o verificamos si realmente no hay sesión para redirigir
        if (isMounted) {
            console.warn("⚠️ Sin sesión activa, redirigiendo a login...");
            router.replace("/login");
        }
      }
    });

    // Cleanup function: Vital para evitar el "AbortError"
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); 

  const handleLogout = async () => {
    await supabase.auth.signOut(); 
    window.location.href = "/login";          
  };

  // --- LÓGICA VISUAL ---
  const meta = user?.user_metadata || {};
  const displayName = profile?.full_name?.split(' ')[0] 
    || meta.full_name?.split(' ')[0] 
    || user?.email?.split('@')[0] 
    || 'Productor';

  // --- LÓGICA DE PODER (ADMIN) ---
  const MY_EMAIL = "cristobal.andres.inta@gmail.com"; 
  const isAdmin = profile?.role === 'admin' || user?.email === MY_EMAIL;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
        <p className="text-xs tracking-widest uppercase animate-pulse">Cargando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans relative overflow-hidden">
      
      {/* FONDO */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Sistema Online</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-400 font-bold">{displayName}</span>.
            </h1>
            
            {/* BOTÓN PARA PROVOCAR ERROR (SOLO PARA PRUEBAS - PUEDES BORRARLO LUEGO) */}
            <button 
                onClick={() => {
                    console.error("🚨 PRUEBA DE LOGS: El usuario presionó el botón de error.");
                    throw new Error("TEST DE VERCEL: Si lees esto en los logs, el sistema de reportes funciona.");
                }}
                className="mt-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-all text-xs font-bold tracking-widest uppercase animate-pulse"
            >
                💥 Provocar Error para Vercel
            </button>

          </div>

          <div className="flex items-center gap-3">
            
            {/* BOTÓN ENTERPRISE */}
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

            <button onClick={() => alert("Link copiado")} className="group flex items-center gap-3 px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all">
               <Zap className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-bold text-white">Copiar Link</span>
            </button>
            
            <button onClick={handleLogout} className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
                <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <SpotlightCard href="/calendar" title="Calendario" subtitle="Agenda" icon={<Calendar />} color="emerald" />
          <SpotlightCard href="/projects" title="Studio Hub" subtitle="Mezclas" icon={<Music4 />} badge="BETA" color="amber" />
          <SpotlightCard href="/requests" title="Solicitudes" subtitle="Entrada" icon={<Inbox />} color="blue" />
          <SpotlightCard href="/clients" title="Clientes" subtitle="CRM" icon={<Users />} color="purple" />
        </div>
        
         {/* LINKS CONFIGURACIÓN */}
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

// COMPONENTES AUXILIARES
function SpotlightCard({ href, title, subtitle, icon, badge, color = "emerald" }: any) {
  const colors: any = {
    emerald: "text-emerald-400", amber: "text-amber-400", blue: "text-blue-400", purple: "text-purple-400"
  };
  return (
    <Link href={href} className="group relative bg-[#0F1112] border border-zinc-800 rounded-[2rem] p-8 transition-all hover:border-zinc-600 hover:-translate-y-1">
      <div className="flex justify-between mb-4">
         <div className={`h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center ${colors[color]}`}>{icon}</div>
         {badge && <span className="px-2 py-1 h-fit rounded bg-blue-500/10 text-[10px] text-blue-400 font-bold uppercase">{badge}</span>}
      </div>
      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">{subtitle}</p>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </Link>
  );
}
function AdminLink({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800 transition-all">
      <div className="h-10 w-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-zinc-500">{icon}</div>
      <div><h4 className="text-sm font-bold text-zinc-300 hover:text-white">{title}</h4><p className="text-[10px] text-zinc-600">{desc}</p></div>
    </Link>
  );
}