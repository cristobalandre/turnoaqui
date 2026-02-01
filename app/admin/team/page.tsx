"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; 
import { 
  ArrowLeft, Users, Zap, CheckCircle2, 
  Crown, Calendar, Search, MoreVertical, ShieldAlert,
  Clock, AlertCircle, Trash2, UserX
} from "lucide-react";
import Image from "next/image";

// Definimos los tipos completos
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
  org_id: string | null;
  plan_status: string;
  user_permissions: Permission | Permission[]; 
};

export default function EnterpriseTeamPage() {
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminOrgId, setAdminOrgId] = useState<string | null>(null);
  const [maxSeats] = useState(15); 

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    
    // 1. Obtener mi sesión y mi Org ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Buscamos tu perfil para saber cuál es TU organización
    const { data: myProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', session.user.id)
        .single();
    
    const myOrgId = myProfile?.org_id;
    setAdminOrgId(myOrgId);

    // 2. Obtener TODOS los perfiles (menos yo)
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_permissions (*)
      `)
      .neq('id', session.user.id);

    if (error) {
      console.error("Error cargando equipo:", error);
    } else {
      const all = (allProfiles as any[]) || [];

      // FILTRO 1: EQUIPO ACTIVO (Tienen mi Org ID y están activos)
      const active = all.filter(u => u.org_id === myOrgId && u.plan_status === 'active');
      
      // FILTRO 2: SOLICITUDES (No tienen Org ID o están inactivos/pendientes)
      // Nota: Mostramos a cualquiera sin org como "Candidato"
      const pending = all.filter(u => !u.org_id || u.plan_status !== 'active');

      setActiveUsers(active);
      setPendingUsers(pending);
    }
    setLoading(false);
  };

  // --- ACCIONES DE PERMISOS (Tus switches originales) ---
  const togglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    // Optimistic Update
    setActiveUsers(activeUsers.map(u => {
      if (u.id === userId) {
        const currentPerms = Array.isArray(u.user_permissions) ? u.user_permissions[0] : u.user_permissions;
        return { ...u, user_permissions: { ...currentPerms, [permission]: !currentValue } };
      }
      return u;
    }));

    const { error } = await supabase
      .from('user_permissions')
      .upsert({ user_id: userId, [permission]: !currentValue }, { onConflict: 'user_id' });

    if (error) fetchTeamData(); // Revertir si falla
  };

  const getPerm = (user: UserProfile, perm: 'access_calendar' | 'access_roster') => {
    if (!user.user_permissions) return false;
    const perms = Array.isArray(user.user_permissions) ? user.user_permissions[0] : user.user_permissions;
    return perms ? perms[perm] : false;
  };

  // --- ACCIONES DE GESTIÓN DE USUARIOS (Nuevo) ---
  
  // APROBAR: Lo metemos a tu Org y lo activamos
  const handleApprove = async (userId: string) => {
    if (!adminOrgId) return alert("Error: No tienes una organización asignada.");
    
    const { error } = await supabase.from('profiles').update({ 
        org_id: adminOrgId, 
        plan_status: 'active',
        role: 'user'
    }).eq('id', userId);

    if (error) alert("Error al aprobar");
    else fetchTeamData();
  };

  // RECHAZAR / DESVINCULAR: Lo sacamos de la Org (vuelve al limbo)
  const handleUnlink = async (userId: string, isReject = false) => {
    if (!confirm(isReject ? "¿Rechazar solicitud?" : "¿Estás seguro de desvincular a este usuario? Perderá acceso inmediato.")) return;

    const { error } = await supabase.from('profiles').update({ 
        org_id: null, 
        plan_status: 'inactive' 
    }).eq('id', userId);

    if (error) alert("Error al desvincular");
    else fetchTeamData();
  };

  const Switch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-11 h-6 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 p-6 md:p-10 relative overflow-hidden font-sans">
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
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
                {/* Contador de Asientos */}
                <div className="text-right hidden md:block">
                     <p className="text-3xl font-bold text-white">{activeUsers.length + 1}<span className="text-zinc-600 text-lg">/{maxSeats}</span></p>
                     <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Asientos</p>
                </div>
            </div>

            {/* 🔔 SECCIÓN 1: SOLICITUDES PENDIENTES (SALA DE ESPERA) */}
            {pendingUsers.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-3 text-amber-500 font-bold text-xs uppercase tracking-widest pl-2">
                        <AlertCircle size={14} /> Solicitudes de Ingreso ({pendingUsers.length})
                    </div>
                    <div className="grid gap-3">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-amber-500/10 transition-colors">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold border border-amber-500/30">
                                        {user.full_name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{user.full_name || "Usuario Nuevo"}</h3>
                                        <p className="text-zinc-500 text-xs">{user.email}</p>
                                    </div>
                                    <div className="ml-auto md:ml-4 flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase bg-amber-500/10 px-2 py-1 rounded">
                                        <Clock size={10} /> Esperando
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={() => handleUnlink(user.id, true)}
                                        className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-zinc-700 hover:border-red-500/50 hover:text-red-400 text-zinc-400 text-xs font-bold transition-all"
                                    >
                                        Rechazar
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(user.id)}
                                        className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={14} /> Aprobar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 👥 SECCIÓN 2: EQUIPO ACTIVO (Tus usuarios aprobados) */}
            <div className="bg-[#0F1112] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <Users size={16} className="text-zinc-500" /> Miembros Activos
                    </h3>
                    {/* Buscador pequeño */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input type="text" placeholder="Buscar miembro..." className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700 w-48" />
                    </div>
                </div>

                <div className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <div className="p-12 text-center text-xs tracking-[0.3em] animate-pulse text-emerald-500/50 font-bold">SINCRONIZANDO...</div>
                    ) : activeUsers.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500 italic text-sm flex flex-col items-center">
                            <ShieldAlert className="w-10 h-10 mb-3 opacity-30"/>
                            <p>No tienes miembros activos.</p>
                            <p className="text-xs mt-1 opacity-50">Acepta las solicitudes pendientes arriba.</p>
                        </div>
                    ) : (
                        activeUsers.map((user) => (
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
                                        <p className="text-white font-medium text-sm flex items-center gap-2">
                                            {user.full_name || "Usuario"}
                                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Activo</span>
                                        </p>
                                        <p className="text-[10px] text-zinc-600">{user.email}</p>
                                    </div>
                                </div>

                                {/* PERMISOS (Tus Switches originales) */}
                                <div className="flex items-center gap-8 w-full md:w-auto justify-end">
                                    
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            <Calendar size={10} /> Calendar
                                        </div>
                                        <Switch 
                                            active={getPerm(user, 'access_calendar')} 
                                            onClick={() => togglePermission(user.id, 'access_calendar', getPerm(user, 'access_calendar'))} 
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            <Users size={10} /> Roster
                                        </div>
                                        <Switch 
                                            active={getPerm(user, 'access_roster')} 
                                            onClick={() => togglePermission(user.id, 'access_roster', getPerm(user, 'access_roster'))} 
                                        />
                                    </div>

                                    {/* SEPARADOR VERTICAL */}
                                    <div className="w-px h-8 bg-zinc-800 mx-2" />

                                    {/* BOTÓN DESVINCULAR (Nuevo) */}
                                    <button 
                                        onClick={() => handleUnlink(user.id)}
                                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all tooltip"
                                        title="Desvincular Usuario"
                                    >
                                        <UserX size={18} />
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