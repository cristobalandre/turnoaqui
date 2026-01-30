"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import { Shield, LogOut, User as UserIcon, RefreshCw } from "lucide-react"; // Agregué icono de reintento
import Link from "next/link";

const supabase = createClient();

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Conectando...");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1. Verificar sesión con manejo de errores de reloj
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("Error de sesión:", error.message);
          
          // DETECTOR DE ERROR DE FUTURO
          if (error.message.includes("future") || error.message.includes("skew")) {
            if (retryCount < 3) {
              setStatusMsg(`Sincronizando reloj (${retryCount + 1}/3)...`);
              setTimeout(() => {
                if (mounted) setRetryCount(prev => prev + 1); // Esto dispara el useEffect de nuevo
              }, 2000); // Esperamos 2 segundos para que el "futuro" se vuelva "presente"
              return;
            }
          }
          
          throw error;
        }

        if (!session) {
          console.log("No hay sesión, redirigiendo...");
          router.replace("/login");
          return;
        }

        // 2. Cargar perfil
        setStatusMsg("Cargando perfil...");
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          if (data) setProfile(data);
          setLoading(false);
        }

      } catch (err) {
        console.error("Fallo crítico:", err);
        router.replace("/login");
      }
    };

    init();

    return () => { mounted = false; };
  }, [router, retryCount]); // Se re-ejecuta si cambia retryCount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          {retryCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-zinc-400 text-sm animate-pulse">{statusMsg}</p>
        {retryCount > 0 && (
          <p className="text-xs text-amber-500/80">
            Detectamos una diferencia de hora con el servidor. Ajustando...
          </p>
        )}
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">
            T
          </div>
          <span className="font-bold text-xl tracking-tight">TurnoAquí</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Hola, {profile?.full_name?.split(' ')[0] || 'Productor'}.
          </h1>
          <p className="text-zinc-500">Bienvenido a tu panel de control.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta Admin */}
          {isAdmin && (
            <Link href="/admin/team" className="block h-full">
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-amber-500/20 hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="w-24 h-24 text-amber-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20">
                      SOLO ADMIN
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    Panel Admin
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Gestionar usuarios, base de datos y configuraciones globales del estudio.
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Tarjeta Perfil */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <UserIcon className="w-24 h-24 text-emerald-500" />
             </div>
             <div className="relative z-10">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mi Perfil</h3>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">Estado:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    profile?.plan_status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {profile?.plan_status === 'active' ? 'Activo' : 'Pendiente'}
                  </span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}