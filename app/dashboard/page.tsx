"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, Inbox, Users, Scissors, Package, 
  Settings, ChevronRight, Activity, Info, Zap, LayoutDashboard
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Intentamos buscar el nombre en la tabla 'profiles', si no, usamos el de Google
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
      setLoading(false);
    };
    getData();
  }, []);

  // Lógica inteligente para el nombre:
  // 1. Nombre en perfil (Base de datos) -> 2. Nombre en Google -> 3. "Colega"
  const displayName = profile?.full_name?.split(' ')[0] 
    || user?.user_metadata?.full_name?.split(' ')[0] 
    || 'Colega';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* 🟢 FONDO CON VIDA (Glows animados) */}
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
              Bienvenido a tu consola. Aquí tienes el control total de tus sesiones y clientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/booking`);
                alert("✅ ¡Link copiado! Envíalo por WhatsApp.");
              }}
              className="group flex items-center gap-3 px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:border-emerald-500/50 hover:bg-zinc-800 transition-all shadow-lg"
            >
              <div className="p-1.5 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-zinc-500 group-hover:text-emerald-400 transition-colors">Tu Link Público</span>
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Copiar Enlace de Reserva</span>
              </div>
            </button>
            
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-emerald-500" />
             </div>
          </div>
        </header>

        {/* --- INSTRUCCIONES / BANNER --- */}
        <div className="mb-10 p-1 rounded-2xl bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-800">
           <div className="bg-[#0c0c0e] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Info size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white">¿Por dónde empiezo?</h3>
                    <p className="text-xs text-zinc-500">Usa el <strong>Calendario</strong> para agendar manualmente o revisa <strong>Solicitudes</strong> para ver quién reservó por la web.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* --- GRID PRINCIPAL (Tarjetas Vistosas) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <SpotlightCard 
            href="/calendar" 
            title="Calendario" 
            subtitle="Agenda y Bloqueos"
            desc="Aquí gestionas tus horas, creas reservas manuales y ves disponibilidad." 
            icon={<Calendar />}
            color="emerald"
          />
          <SpotlightCard 
            href="/requests" 
            title="Solicitudes" 
            subtitle="Buzón de Entrada"
            desc="Citas agendadas por clientes desde la web. Revísalas y apruébalas." 
            icon={<Inbox />} 
            badge="Revisar"
            color="blue"
          />
          <SpotlightCard 
            href="/clients" 
            title="Clientes" 
            subtitle="Base de Datos"
            desc="Historial de quienes han visitado tu estudio y sus datos de contacto." 
            icon={<Users />}
            color="purple"
          />
        </div>

        {/* --- ADMINISTRACIÓN --- */}
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-6 font-black flex items-center gap-3">
             <LayoutDashboard size={14} /> Configuración del Estudio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminLink 
              href="/services" 
              title="Servicios" 
              desc="Precios y Duración"
              icon={<Scissors />} 
            />
            <AdminLink 
              href="/staff" 
              title="Staff" 
              desc="Productores / Ing"
              icon={<Users />} 
            />
            <AdminLink 
              href="/resources" 
              title="Recursos" 
              desc="Salas y Equipos"
              icon={<Package />} 
            />
            <AdminLink 
              href="/settings" 
              title="Ajustes" 
              desc="General"
              icon={<Settings />} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTES VISUALES MEJORADOS
// ----------------------------------------------------------------------

function SpotlightCard({ href, title, subtitle, desc, icon, badge, color = "emerald" }: any) {
  // Mapa de colores para los brillos
  const colors: any = {
    emerald: "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 text-emerald-400",
    blue: "group-hover:bg-blue-500/10 group-hover:border-blue-500/50 text-blue-400",
    purple: "group-hover:bg-purple-500/10 group-hover:border-purple-500/50 text-purple-400",
  };
  
  const iconColor = colors[color] || colors.emerald;

  return (
    <Link href={href} className="group relative bg-[#0F1112] border border-zinc-800 rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 overflow-hidden">
      
      {/* Glow de Fondo al Hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
           <div className={`h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all duration-300 ${iconColor}`}>
             {icon}
           </div>
           {badge && (
             <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
               {badge}
             </span>
           )}
        </div>

        <div className="mt-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{subtitle}</p>
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">{desc}</p>
        </div>

        {/* Flecha interactiva */}
        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-zinc-600 group-hover:text-white transition-colors">
           <span>INGRESAR</span>
           <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function AdminLink({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-700 transition-all group">
      <div className="h-10 w-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{title}</h4>
        <p className="text-[10px] text-zinc-600 group-hover:text-zinc-500">{desc}</p>
      </div>
    </Link>
  );
}