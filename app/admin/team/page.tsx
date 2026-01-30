"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { 
  ArrowLeft, Shield, Users, Lock, Unlock, Zap, CheckCircle2, 
  Crown, Calendar, UserCheck, Search, MoreVertical 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export default function EnterpriseTeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  
  // Config del Plan (Esto vendría de la DB en el futuro)
  const [plan, setPlan] = useState<'enterprise_5' | 'enterprise_15'>('enterprise_15');
  const maxSeats = plan === 'enterprise_5' ? 5 : 15;

  const supabase = createClient();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    // 1. Verificar Admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCurrentAdmin(session.user);

    // 2. Obtener Perfiles + Permisos
    // (Unimos las tablas profiles y user_permissions)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_permissions (*)
      `)
      .neq('id', session.user.id); // Excluir al admin de la lista (él tiene todo)

    if (data) setUsers(data);
    setLoading(false);
  };

  const togglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    // Actualización Optimista (Visual instantánea)
    setUsers(users.map(u => 
        u.id === userId 
        ? { ...u, user_permissions: { ...u.user_permissions, [permission]: !currentValue } }
        : u
    ));

    // Actualización Real en DB
    await supabase
      .from('user_permissions')
      .update({ [permission]: !currentValue })
      .eq('user_id', userId);
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
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} p-6 md:p-10 relative overflow-hidden`}>
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/projects" className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                    <ArrowLeft className="text-white" size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        Gestión de Equipo <span className="text-emerald-400 text-sm font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">Enterprise</span>
                    </h1>
                    <p className="text-zinc-500">Administra los accesos de tus mortales.</p>
                </div>
            </div>

            {/* TARJETA DE PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-r from-zinc-900 to-[#0c0c0e] border border-zinc-800 p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Crown size={20} className="text-amber-500" />
                             <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Tu Licencia</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {plan === 'enterprise_15' ? 'Enterprise Studio Pro' : 'Starter Team'}
                        </h2>
                        <p className="text-zinc-400 text-sm">Hasta {maxSeats} miembros activos en tu organización.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-4xl font-bold text-white">{users.length}<span className="text-zinc-600 text-xl">/{maxSeats}</span></p>
                         <p className="text-xs text-zinc-500 uppercase font-bold mt-1">Asientos Ocupados</p>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                        <Zap size={24} />
                    </div>
                    <p className="text-white font-bold">Estado del Sistema</p>
                    <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Operativo</p>
                </div>
            </div>

            {/* LISTA DE USUARIOS */}
            <div className="bg-[#0F1112] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-zinc-500" /> Miembros del Equipo
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input type="text" placeholder="Buscar usuario..." className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <div className="p-10 text-center text-zinc-500">Cargando la matrix...</div>
                    ) : users.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500">No hay mortales en tu equipo aún.</div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-zinc-900/30 transition-colors group">
                                
                                {/* INFO USUARIO */}
                                <div className="flex items-center gap-4 w-full md:w-1/3">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 relative overflow-hidden border border-zinc-700">
                                        <Image src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} alt="User" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{user.full_name || "Usuario Sin Nombre"}</p>
                                        <p className="text-xs text-zinc-500">{user.email}</p>
                                    </div>
                                </div>

                                {/* PERMISOS (SWITCHES) */}
                                <div className="flex items-center gap-8 w-full md:w-auto justify-end">
                                    
                                    {/* PERMISO: CALENDARIO */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                            <Calendar size={14} /> Calendar
                                        </div>
                                        <Switch 
                                            active={user.user_permissions?.access_calendar} 
                                            onClick={() => togglePermission(user.id, 'access_calendar', user.user_permissions?.access_calendar)} 
                                        />
                                    </div>

                                    {/* PERMISO: ROSTER (Artistas) */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                            <Users size={14} /> Roster
                                        </div>
                                        <Switch 
                                            active={user.user_permissions?.access_roster} 
                                            onClick={() => togglePermission(user.id, 'access_roster', user.user_permissions?.access_roster)} 
                                        />
                                    </div>

                                    {/* OPCIONES EXTRA */}
                                    <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                        <MoreVertical size={18} />
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