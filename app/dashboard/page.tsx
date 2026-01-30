"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, LogOut, User as UserIcon, RefreshCw, 
  LayoutGrid, Calendar, Music4, Box, Users, 
  Settings, Zap, ArrowRight, AlertTriangle 
} from "lucide-react";

// ✅ Cliente Único
const supabase = createClient();

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Iniciando...");
  const [showForceBtn, setShowForceBtn] = useState(false); // Botón de emergencia
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // ⏱️ CRONÓMETRO DE EMERGENCIA
    // Si en 3 segundos no hemos cargado, mostramos el botón de escape.
    const panicTimer = setTimeout(() => {
      if (mounted && loading) {
        setStatusMsg("La conexión está tardando más de lo normal...");
        setShowForceBtn(true);
      }
    }, 3000);

    const init = async () => {
      try {
        setStatusMsg("Contactando servidor...");

        // 1. OBTENER SESIÓN CON TIMEOUT
        // Forzamos a que la promesa falle si tarda más de 5 segundos
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const { data: { session }, error }: any = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) throw error;

        if (!session) {
          if (mounted) router.replace("/login");
          return;
        }

        // 2. CARGAR PERFIL
        setStatusMsg("Cargando perfil...");
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          if (data) setProfile(data);
          setLoading(false); // ✅ ¡EXITO!
        }

      } catch (err: any) {
        console.error("Error o Timeout:", err);
        // Si falló, activamos el modo de emergencia inmediatamente
        if (mounted) {
          setStatusMsg("No se pudo establecer conexión automática.");
          setShowForceBtn(true);
        }
      } finally {
        clearTimeout(panicTimer);
      }
    };

    init();
    return () => { 
      mounted = false; 
      clearTimeout(panicTimer);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  // Botón para recargar página completa (limpia memoria)
  const forceReload = () => {
    window.location.reload();
  };

  // --- PANTALLA DE CARGA / ERROR ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white gap-6 p-4 text-center">
        {!showForceBtn ? (
          <>
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-sm animate-pulse">{statusMsg}</p>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-w-sm">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Conexión Lenta</h3>
            <p className="text-zinc-500 text-sm mb-6">
              El navegador no logra conectar con la base de datos. Puede ser un bloqueo temporal.
            </p>
            <button 
              onClick={forceReload}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </button>
            <p className="mt-4 text-xs text-zinc-600">
              Si esto persiste, borra las cookies del sitio.
            </p>
          </div>
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
          <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
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
            <span className="text-xs font-medium text-zinc-400">
              {profile?.plan_status === 'active' ? 'Activo' : 'Verificando'}
            </span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/studio" className="col-span-1 md:col-span-2 lg:col-span-2 group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><LayoutGrid className="w-32 h-32" /></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><LayoutGrid className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold">Studio Hub</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 max-w-sm">Panel central de control.</p>
              <div className="flex items-center text-emerald-500 text-sm font-medium gap-1 group-hover:gap-2 transition-all">
                Entrar <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/calendar" className="group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all cursor-pointer">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg w-fit mb-4"><Calendar className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold mb-1">Calendario</h3>
            </div>
          </Link>

          <Link href="/projects" className="group">
            <div className="h-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900 transition-all cursor-pointer">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg w-fit mb-4"><Music4 className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold mb-1">Proyectos</h3>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Link href="/resources"><div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800"><h3 className="font-semibold text-zinc-200">Recursos</h3></div></Link>
           <Link href="/team"><div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800"><h3 className="font-semibold text-zinc-200">Staff</h3></div></Link>
           <Link href="/settings"><div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800"><h3 className="font-semibold text-zinc-200">Ajustes</h3></div></Link>
        </div>

        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <Link href="/admin/team">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 hover:border-amber-500/50 transition-all cursor-pointer flex items-center gap-4">
                <Shield className="w-8 h-8 text-amber-500" />
                <div><h3 className="text-xl font-bold text-amber-500">Panel Super Admin</h3><p className="text-zinc-500 text-sm">Control total.</p></div>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}