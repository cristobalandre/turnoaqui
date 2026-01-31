"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { 
  Plus, Music4, Clock, Mic2, Search, 
  BarChart3, Zap, LayoutGrid, AlertTriangle, 
  Play, ArrowRight, Disc, Layers
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
  
  // Estadísticas (Lógica intacta)
  const [stats, setStats] = useState({ total: 0, active: 0, storage: "0 MB" });

  const supabase = createClient();

  const fetchProjects = async () => {
    const safetyTimer = setTimeout(() => {
        if (loading) {
            setLoading(false);
            setErrorMsg("La conexión tardó demasiado.");
        }
    }, 5000);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setUser(session.user);

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
            active: data.filter((p: any) => p.status === 'En Revisión').length,
            storage: `${(data.length * 3.5).toFixed(1)} MB` // Cálculo simulado
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

  useEffect(() => {
    const results = projects.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.artist?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProjects(results);
  }, [search, projects]);

  // 🎨 Generador de Gradientes "Artísticos"
  const generateGradient = (id: string) => {
    const arts = [
      "from-purple-900 via-fuchsia-900 to-black",
      "from-emerald-900 via-teal-900 to-black",
      "from-blue-900 via-indigo-900 to-black",
      "from-rose-900 via-red-900 to-black",
      "from-amber-900 via-orange-900 to-black",
    ];
    const index = id.charCodeAt(id.length - 1) % arts.length;
    return arts[index];
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-zinc-300 ${outfit.className} p-6 pb-20 md:p-10 relative overflow-hidden selection:bg-emerald-500/30`}>
      
      {/* 🎨 FONDO "FINE ART" (Coincide con Dashboard) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-white to-zinc-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <span className="font-bold text-black text-xl">S</span>
            </div>
            <div>
               <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Colección</p>
               <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                 Studio Hub
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/dashboard">
                <button className="px-5 py-3 bg-[#0A0A0A] border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:text-white hover:border-zinc-600 transition-all text-sm">
                    Volver
                </button>
            </Link>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none group flex items-center justify-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 text-sm">
                <Plus size={16} /> <span>NUEVO</span>
            </button>
          </div>
        </div>

        {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in backdrop-blur-md">
                <AlertTriangle size={20} /> <span className="font-bold text-sm">{errorMsg}</span>
            </div>
        )}

        {/* 📊 STATS (Estilo Widget de Cristal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: "Proyectos Totales", val: stats.total, icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
             { label: "En Revisión", val: stats.active, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/10" },
             { label: "Almacenamiento", val: stats.storage, icon: BarChart3, color: "text-fuchsia-400", bg: "bg-fuchsia-500/5", border: "border-fuchsia-500/10" }
           ].map((stat, i) => (
             <div key={i} className={`p-5 rounded-2xl ${stat.bg} border ${stat.border} backdrop-blur-md flex items-center gap-4`}>
                <div className={`p-3 rounded-xl bg-black/20 ${stat.color}`}><stat.icon size={20} /></div>
                <div><p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{stat.label}</p><p className="text-xl font-bold text-white">{stat.val}</p></div>
             </div>
           ))}
        </div>

        {/* 🔍 BARRA DE FILTRO */}
        <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
            <input type="text" placeholder="Filtrar por artista o nombre del track..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-800/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600" />
        </div>

        {/* 📀 GRID DE OBRAS DE ARTE */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-900/30 rounded-3xl border border-zinc-800/50"></div>)}
           </div>
        ) : filteredProjects.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-900/10">
              <Disc className="text-zinc-700 mb-4" size={48} />
              <p className="text-zinc-500 text-sm">Tu galería está vacía.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="group relative flex flex-col bg-[#0A0A0A] border border-white/5 hover:border-emerald-500/30 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer h-full">
                  
                  {/* ARTE VISUAL (Gradiente) */}
                  <div className={`h-48 w-full bg-gradient-to-br ${generateGradient(project.id)} relative p-6 flex flex-col justify-between overflow-hidden`}>
                     {/* Ruido de fondo para textura */}
                     <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.org/noise.svg')]" />
                     
                     <div className="relative z-10 flex justify-between items-start">
                        <div className="p-2 bg-black/30 backdrop-blur-md rounded-lg text-white/80 border border-white/5">
                           <Music4 size={16} />
                        </div>
                        <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                           {project.status}
                        </div>
                     </div>
                     
                     {/* Overlay Play */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] bg-black/20">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <Play size={20} fill="black" className="text-black ml-1" />
                        </div>
                     </div>
                  </div>

                  {/* INFO */}
                  <div className="p-5 flex-1 flex flex-col">
                     <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-4 truncate">{project.artist}</p>
                     </div>
                     
                     <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                            <Clock size={12} /> {new Date(project.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            <Mic2 size={10} /> {project.version}
                        </div>
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center py-10 opacity-30 hover:opacity-100 transition-opacity">
           <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600">TurnoAqui OS • Gallery Mode</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)} />
           <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-300">
              <NewProjectModal onClose={() => { setIsModalOpen(false); fetchProjects(); }} />
           </div>
        </div>
      )}
    </div>
  );
}