"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Asegúrate que esta ruta sea correcta
import { useRouter } from "next/navigation";
import { Shield, Users, BarChart3, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

// ✅ INSTANCIA GLOBAL: Movida fuera para evitar múltiples instancias en el navegador
const supabase = createClient();

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      // 1. Obtener Usuario Autenticado
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 2. Obtener Perfil (incluyendo el campo 'role')
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError) {
        setProfile(profileData);
      }
      
      setLoading(false);
    };

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white">
        Cargando tu estudio...
      </div>
    );
  }

  // Lógica de administrador basada en el rol de la base de datos
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              T
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              TurnoAquí
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-400">
                {user?.email}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header de Bienvenida */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Hola, {profile?.full_name?.split(' ')[0] || 'Productor'}.
          </h1>
          <p className="text-zinc-500 text-lg">
            Aquí está el resumen de tu actividad hoy.
          </p>
        </div>

        {/* Grid de Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta 1: Mi Perfil */}
          <div className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserIcon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                <UserIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mi Perfil</h3>
              <p className="text-zinc-500 text-sm">Gestiona tus datos personales y configuración.</p>
            </div>
          </div>

          {/* Tarjeta 2: Estadísticas */}
          <div className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Métricas</h3>
              <p className="text-zinc-500 text-sm">Visualiza el rendimiento de tus salas.</p>
            </div>
          </div>

          {/* Tarjeta ADMIN */}
          {isAdmin && (
            <Link href="/admin/team">
              <div className="group p-6 rounded-2xl bg-zinc-900 border border-amber-500/20 hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] cursor-pointer relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="w-24 h-24 text-amber-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-amber-500">Panel Admin</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      SOLO EQUIPO
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">Gestionar usuarios, permisos y base de datos global.</p>
                </div>
              </div>
            </Link>
          )}

        </div>
      </main>
    </div>
  );
}