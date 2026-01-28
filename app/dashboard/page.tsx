"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, Globe, Inbox, Scissors, Users, Package, 
  Settings, ChevronRight, Activity, Zap
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
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
      setLoading(false);
    };
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans relative overflow-hidden">
      
      {/* 🟢 AURA ESMERALDA DE FONDO */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* 🖼️ IMAGEN SUTIL A LA DERECHA (Look Minimalista) */}
      <div className="absolute right-[-5%] bottom-[-5%] w-[600px] h-[600px] opacity-[0.03] pointer-events-none z-0 grayscale contrast-125">
         <img src="/tu-imagen.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8">
        
        {/* HEADER DE BIENVENIDA */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2 font-bold">Panel de Control</p>
            <h1 className="text-4xl font-light text-white tracking-tight">
              Hola, <span className="text-zinc-500 italic">{user?.user_metadata?.full_name?.split(' ')[0] || 'Studio'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
          <button
  onClick={() => {
    navigator.clipboard.writeText(`${window.location.origin}/booking`);
    alert("✅ ¡Link de reserva copiado!");
  }}
  className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/50 rounded-full transition-all text-xs font-bold text-zinc-400 hover:text-emerald-400 group"
>
  {/* Icono Link */}
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-45 transition-transform"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  
  <span>Copiar Link Reserva</span>
</button>

             <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Activity className="h-4 w-4 text-emerald-500" />
             </div>
          </div>
        </header>

        {/* SECCIÓN PRINCIPAL: ACCIONES RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <DashboardCard 
            href="/requests" 
            title="Solicitudes" 
            desc="Gestión de citas web" 
            icon={<Inbox />} 
            badge="Nueva"
          />
          <DashboardCard 
            href="/calendar" 
            title="Calendario" 
            desc="Agenda y horarios" 
            icon={<Calendar />} 
          />
          <DashboardCard 
            href="/clients" 
            title="Clientes" 
            desc="Base de datos Pro" 
            icon={<Users />} 
          />
        </div>

        {/* ADMINISTRACIÓN (Look Gemini) */}
        <div className="mt-16">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-8 font-black flex items-center gap-3">
             <div className="h-px w-8 bg-zinc-800" /> Administración del Sistema
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AdminLink href="/services" title="Servicios" icon={<Scissors />} />
            <AdminLink href="/staff" title="Staff" icon={<Users />} />
            <AdminLink href="/resources" title="Recursos" icon={<Package />} />
            <AdminLink href="/settings" title="Ajustes" icon={<Settings />} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Componentes Estilizados Gemini Pro
function DashboardCard({ href, title, desc, icon, badge }: any) {
  return (
    <Link href={href} className="group relative bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
         {icon}
      </div>
      <div className="relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 transition-all duration-500">
          <div className="text-zinc-500 group-hover:text-emerald-400">
            {icon}
          </div>
        </div>
        <h3 className="text-white text-xl font-medium mb-2 flex items-center gap-2">
          {title} {badge && <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">{badge}</span>}
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

function AdminLink({ href, title, icon }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-800/40 hover:border-zinc-700 transition-all group">
      <div className="flex items-center gap-3">
        <div className="text-zinc-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{title}</span>
      </div>
      <ChevronRight className="h-3 w-3 text-zinc-700 group-hover:text-emerald-500 transition-all transform group-hover:translate-x-1" />
    </Link>
  );
}