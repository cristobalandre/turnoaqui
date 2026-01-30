"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import { Shield, BarChart3, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

const supabase = createClient();

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(""); // Para ver errores en pantalla
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      try {
        console.log("Iniciando carga del dashboard...");
        
        // 1. Obtener Usuario
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("Error de Auth:", authError);
          router.push("/login");
          return;
        }
        setUser(user);

        // 2. Obtener Perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error de Perfil:", profileError);
          // No bloqueamos, solo logueamos. Podría ser un usuario nuevo.
        } else {
          setProfile(profileData);
        }

      } catch (err: any) {
        console.error("Error CRÍTICO:", err);
        setErrorMsg(err.message || "Error desconocido");
      } finally {
        // ESTO ASEGURA QUE SIEMPRE SE QUITE EL "CARGANDO"
        setLoading(false);
      }
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando tu estudio...</p>
        </div>
      </div>
    );
  }

  // Si hubo un error grave, lo mostramos en vez de la pantalla negra
  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h2 className="text-red-500 text-xl font-bold mb-2">Algo salió mal</h2>
        <p className="text-zinc-400 mb-4">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700">
          Reintentar
        </button>
      </div>
    );
  }

  // Lógica de Admin (Usamos la lista VIP o el rol)
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              TurnoAquí
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-400 hidden md:block">
              {user?.email}
            </span>
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
          Hola, {profile?.full_name?.split(' ')[0] || 'Productor'}.
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Tarjeta Admin */}
          {isAdmin && (
            <Link href="/admin/team">
              <div className="group p-6 rounded-2xl bg-zinc-900 border border-amber-500/20 hover:border-amber-500/50 cursor-pointer h-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-amber-500">Panel Admin</h3>
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-zinc-500 text-sm">Gestionar usuarios y base de datos.</p>
              </div>
            </Link>
          )}
          
          {/* Tarjeta Perfil */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
             <h3 className="text-xl font-bold mb-2">Mi Perfil</h3>
             <p className="text-zinc-500 text-sm">Estado: <span className="text-emerald-400">{profile?.plan_status || 'Activo'}</span></p>
          </div>
        </div>
      </main>
    </div>
  );
}