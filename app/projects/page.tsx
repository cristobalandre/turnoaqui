"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { 
  Plus, Music4, Clock, Mic2, Search, 
  BarChart3, Zap, Filter, LayoutGrid, Users, AlertTriangle 
} from "lucide-react";
import NewProjectModal from "@/components/projects/NewProjectModal";
import { createClient } from "@/lib/supabase/client";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // Estadísticas
  const [stats, setStats] = useState({ total: 0, active: 0, storage: "0 MB" });

  const supabase = createClient();

  const fetchProjects = async () => {
    // TEMPORIZADOR DE SEGURIDAD: Si en 5s no carga, forzamos la salida para que no se quede pegado
    const safetyTimer = setTimeout(() => {
        if (loading) {
            setLoading(false);
            setErrorMsg("La conexión tardó demasiado.");
        }
    }, 5000);

    try {
        // 1. Obtener Usuario
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setUser(session.user);

        // 2. Obtener Proyectos
        const { data, error: dbError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (dbError) throw dbError;
        
        if (data) {
          setProjects(data);
          setFilteredProjects(data);
          
          setStats({
            total: data.length,
            active: data.filter(p => p.status === 'En Revisión').length,
            // Cálculo estimado: 3.5MB por proyecto
            storage: `${(data.length * 3.5).toFixed(1)} MB`
          });
        }
    } catch (err: any) {
        console.error("🔥 Error:", err);
        setErrorMsg("Error cargando proyectos.");
    } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filtro en tiempo real
  useEffect(() => {
    const results = projects.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.artist?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProjects(results);
  }, [search, projects]);

  const generateGradient = (id: string) => {
    const colors = [
      "from-pink-500 to-rose-500", "from-amber-500 to-orange-600",
      "from-emerald-400 to-cyan-600", "from-violet-600 to-indigo-600",
      "from-blue-400 to-blue-600", "from-fuchsia-500 to-purple-600",
    ];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} p-6 pb-20 md:p-10 relative overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-zinc-900/50 to-[#09090b] pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50"><LayoutGrid size={24} className="text-white" /></div>
            <div>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Centro de Mando</p>
               <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                 Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">{user?.user_metadata?.full_name?.split(" ")[0] || "Productor"}</span> 👋
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* BOTÓN ROSTER (ARTISTAS) */}
            <Link href="/artists">
                <button className="group flex items-center gap-2 px-5 py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-2xl transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700 hover:scale-[1.02] active:scale-95">
                    <Users size={18} /><span className="text-sm">ROSTER</span>
                </button>
            </Link>
            {/* BOTÓN SUBIR PROYECTO */}
            <button onClick={() => setIsModalOpen(true)} className="group flex items-center gap-3 px-6 py-4 bg-white text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95">
                <div className="bg-black text-white p-1 rounded-full"><Plus size={14} /></div><span>SUBIR PROYECTO</span>
            </button>
          </div>
        </div>

        {/* 🚨 AVISO DE ERROR (Si ocurre) */}
        {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <AlertTriangle size={20} />
                <span className="font-bold">{errorMsg}</span>
            </div>
        )}

        {/* 📊 STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md flex items-center gap-4 hover:border-zinc-700 transition-colors">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><Music4 size={24} /></div>
              <div><p className="text-xs text-zinc-500 uppercase font-bold">Total Proyectos</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
           </div>
           <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md flex items-center gap-4 hover:border-zinc-700 transition-colors">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Zap size={24} /></div>
              <div><p className="text-xs text-zinc-500 uppercase font-bold">En Revisión</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
           </div>
           <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md flex items-center gap-4 hover:border-zinc-700 transition-colors">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500"><BarChart3 size={24} /></div>
              <div><p className="text-xs text-zinc-500 uppercase font-bold">Espacio Usado</p><p className="text-2xl font-bold text-white">{stats.storage}</p></div>
           </div>
        </div>

        {/* 🔍 BÚSQUEDA */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-20">
           <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0F1112]/90 backdrop-blur-xl border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-xl" />
           </div>
           <div className="flex gap-2">
              <button className="p-3 rounded-xl border border-zinc-800 bg-[#0F1112] text-zinc-400 hover:text-white transition-colors"><Filter size={18} /></button>
           </div>
        </div>

        {/* 📀 GRID DE PROYECTOS */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-zinc-900 rounded-3xl border border-zinc-800"></div>)}
           </div>
        ) : filteredProjects.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4"><Music4 className="text-zinc-600" size={32} /></div>
              <h3 className="text-lg font-bold text-white">No se encontraron pistas</h3>
              <p className="text-zinc-500 text-sm">Sube algo nuevo o cambia el filtro.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group relative flex flex-col bg-[#0F1112] border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-600 transition-all hover:-translate-y-2 hover:shadow-2xl duration-300">
                <div className={`h-40 w-full bg-gradient-to-br ${generateGradient(project.id)} relative p-6 flex flex-col justify-between`}>
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                   <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{project.status}</div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl"><Music4 size={24} className="text-black ml-1" /></div>
                   </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                   <h3 className="text-lg font-bold text-white mb-1 truncate leading-tight group-hover:text-amber-500 transition-colors">{project.title}</h3>
                   <p className="text-sm text-zinc-500 mb-6 truncate">{project.artist}</p>
                   <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Clock size={12} /><span>{new Date(project.created_at).toLocaleDateString()}</span></div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800"><Mic2 size={10} /><span>{project.version}</span></div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center py-10 opacity-30 hover:opacity-100 transition-opacity">
           <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">TurnoAqui Studio OS • v2.6.0</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)} />
           <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-300">
              <NewProjectModal onClose={() => { setIsModalOpen(false); fetchProjects(); }} />
           </div>
        </div>
      )}
    </div>
  );
}