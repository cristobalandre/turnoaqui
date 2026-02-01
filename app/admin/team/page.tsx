"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// Usamos la importación que SÍ te funcionó en Servicios
import { supabase } from "@/lib/supabaseClient"; 
import { 
  ArrowLeft, Users, Zap, CheckCircle2, 
  Crown, Calendar, Search, MoreVertical, ShieldAlert
} from "lucide-react";
import Image from "next/image";

// Definimos los tipos para que TypeScript no se queje
type Permission = {
  user_id: string;
  access_calendar: boolean;
  access_roster: boolean;
};

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  // Supabase devuelve esto como un array o objeto simple dependiendo de la relación
  user_permissions: Permission | Permission[]; 
};

export default function EnterpriseTeamPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxSeats] = useState(15); // Hardcodeado por ahora

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    
    // 1. Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Si no hay sesión, no hacemos nada (el middleware debería redirigir)

    // 2. Obtener Perfiles + Permisos
    // IMPORTANTE: user_permissions debe coincidir con el nombre de la tabla creada en SQL
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_permissions (*)
      `)
      .neq('id', session.user.id); // Excluirte a ti mismo de la lista

    if (error) {
      console.error("Error cargando equipo:", error);
    } else {
      // Forzamos el tipo para evitar errores de TS
      setUsers(data as any); 
    }
    setLoading(false);
  };

  const togglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    // 1. Actualización Visual Inmediata (Optimista)
    setUsers(users.map(u => {
      if (u.id === userId) {
        // Manejamos si user_permissions es array (Supabase a veces devuelve array en joins)
        const currentPerms = Array.isArray(u.user_permissions) ? u.user_permissions[0] : u.user_permissions;
        return {
          ...u,
          user_permissions: { ...currentPerms, [permission]: !currentValue }
        };
      }
      return u;
    }));

    // 2. Guardar en Base de Datos
    // Usamos 'upsert' para asegurar que si no existe la fila, la cree
    const { error } = await supabase
      .from('user_permissions')
      .upsert({ 
        user_id: userId, 
        [permission]: !currentValue 
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error guardando permiso:", error);
      // Aquí podrías revertir el cambio visual si falla
      fetchTeamData(); 
    }
  };

  // Helper para leer permisos seguramente
  const getPerm = (user: UserProfile, perm: 'access_calendar' | 'access_roster') => {
    if (!user.user_permissions) return false;
    const perms = Array.isArray(user.user_permissions) ? user.user_permissions[0] : user.user_permissions;
    return perms ? perms[perm] : false;
  };

  const Switch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6 md:p-10 relative overflow-hidden font-sans">
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                    <ArrowLeft className="text-white" size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-light text-white flex items-center gap-3 tracking-tight">
                        Gestión de Equipo <span className="text-emerald-400 text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">Enterprise</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">Administra los accesos de tus colaboradores.</p>
                </div>
            </div>

            {/* TARJETA DE PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-r from-zinc-900 to-[#0c0c0e] border border-zinc-800 p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Crown size={20} className="text-amber-500" />
                             <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Tu Licencia</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Enterprise Studio Pro
                        </h2>
                        <p className="text-zinc-400 text-xs">Hasta {maxSeats} miembros activos en tu organización.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-4xl font-bold text-white">{users.length + 1}<span className="text-zinc-600 text-xl">/{maxSeats}</span></p>
                         <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-wider">Asientos Ocupados</p>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                        <Zap size={24} />
                    </div>
                    <p className="text-white font-bold text-sm">Estado del Sistema</p>
                    <p className="text-emerald-400 text-[10px] uppercase tracking-wider font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Operativo</p>
                </div>
            </div>

            {/* LISTA DE USUARIOS */}
            <div className="bg-[#0F1112] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <Users size={16} className="text-zinc-500" /> Miembros del Equipo
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input type="text" placeholder="Buscar..." className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700" />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <div className="p-10 text-center text-xs tracking-[0.3em] animate-pulse text-emerald-500/50 font-bold">SINCRONIZANDO LA MATRIX...</div>
                    ) : users.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500 italic text-sm">
                            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                            No hay otros miembros en tu equipo aún.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-zinc-900/30 transition-colors group">
                                
                                {/* INFO USUARIO */}
                                <div className="flex items-center gap-4 w-full md:w-1/3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 relative overflow-hidden border border-zinc-700">
                                        {user.avatar_url ? (
                                            <Image src={user.avatar_url} alt="User" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                                {user.email?.substring(0,2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{user.full_name || "Usuario Sin Nombre"}</p>
                                        <p className="text-[10px] text-zinc-600">{user.email}</p>
                                    </div>
                                </div>

                                {/* PERMISOS (SWITCHES) */}
                                <div className="flex items-center gap-8 w-full md:w-auto justify-end">
                                    
                                    {/* PERMISO: CALENDARIO */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            <Calendar size={10} /> Calendar
                                        </div>
                                        <Switch 
                                            active={getPerm(user, 'access_calendar')} 
                                            onClick={() => togglePermission(user.id, 'access_calendar', getPerm(user, 'access_calendar'))} 
                                        />
                                    </div>

                                    {/* PERMISO: ROSTER (Artistas) */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            <Users size={10} /> Roster
                                        </div>
                                        <Switch 
                                            active={getPerm(user, 'access_roster')} 
                                            onClick={() => togglePermission(user.id, 'access_roster', getPerm(user, 'access_roster'))} 
                                        />
                                    </div>

                                    {/* OPCIONES EXTRA */}
                                    <button className="p-2 text-zinc-700 hover:text-white transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}