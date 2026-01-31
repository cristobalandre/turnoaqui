"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, LogOut, LayoutGrid, Calendar, 
  Box, Users, Settings, ArrowRight, AlertTriangle, RefreshCw, Music4
} from "lucide-react";

const supabase = createClient();

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Iniciando...");
  const [showForceBtn, setShowForceBtn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const panicTimer = setTimeout(() => {
      if (mounted && loading) {
        setStatusMsg("La conexión está tardando...");
        setShowForceBtn(true);
      }
    }, 3000);

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          if (mounted) router.replace("/login");
          return;
        }
        
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (mounted) {
          if (data) setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setShowForceBtn(true);
      } finally {
        clearTimeout(panicTimer);
      }
    };
    init();
    return () => { mounted = false; clearTimeout(panicTimer); };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const forceReload = () => window.location.reload();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white gap-6 p-4 text-center">
        {!showForceBtn ? (
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        ) : (
          <button onClick={forceReload} className="bg-zinc-800 px-4 py-2 rounded-xl text-sm hover:bg-zinc-700">Recargar</button>
        )}
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">T</div>
            <span className="font-bold text-xl tracking-tight">TurnoAquí</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Hola, {profile?.full_name?.split(' ')[0] || 'Productor'}.
            </h1>
            <p className="text-zinc-500">Todo listo para gestionar tu estudio.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
            <div className={`w-2 h-2 rounded-full ${profile?.plan_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-medium text-zinc-400">{profile?.plan_status === 'active' ? 'Activo' : 'Verificando'}</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* 1. STUDIO HUB -> CORREGIDO: Ahora lleva a /projects */}
          {/* Ocupa 2 columnas para ser el centro de atención */}
          <Link href="/projects" className="col-span-1 md:col-span-2 group">
            <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><LayoutGrid className="w-48 h-48 text-emerald-500" /></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><LayoutGrid className="w-8 h-8" /></div>
                <div>
                    <h3 className="text-2xl font-bold text-white">Studio Hub</h3>
                    <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Centro de Control</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mb-8 max-w-md leading-relaxed">
                Accede a tus proyectos, gestiona versiones y revisa el estado de tus mezclas.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm group-hover:scale-105 transition-transform">
                Entrar al Hub <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* 2. CALENDARIO */}
          <Link href="/calendar" className="group">
            <div className="h-full p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col justify-between">
              <div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg w-fit mb-4"><Calendar className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-white mb-1">Calendario</h3>
                <p className="text-zinc-500 text-sm">Próximas sesiones.</p>
              </div>
              <div className="mt-4 flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900" />)}
              </div>
            </div>
          </Link>

          {/* ELIMINADO VISUALMENTE: Botón duplicado de Proyectos (para limpiar el diseño) */}
          {/* <Link href="/projects" ...> ... </Link> */}
        </div>

        {/* BARRA INFERIOR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Link href="/resources"><div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"><Box className="w-5 h-5 text-orange-500 mb-2"/><h3 className="font-semibold text-zinc-300 text-sm">Recursos</h3></div></Link>
           <Link href="/team"><div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"><Users className="w-5 h-5 text-pink-500 mb-2"/><h3 className="font-semibold text-zinc-300 text-sm">Staff</h3></div></Link>
           <Link href="/settings"><div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"><Settings className="w-5 h-5 text-zinc-500 mb-2"/><h3 className="font-semibold text-zinc-300 text-sm">Ajustes</h3></div></Link>
           {isAdmin && (
             <Link href="/admin/team"><div className="p-4 rounded-2xl bg-zinc-900 border border-amber-900/30 hover:border-amber-500/50 transition"><Shield className="w-5 h-5 text-amber-500 mb-2"/><h3 className="font-semibold text-zinc-300 text-sm">Admin</h3></div></Link>
           )}
        </div>
      </main>
    </div>
  );
}