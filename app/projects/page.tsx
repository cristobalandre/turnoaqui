"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowLeft, Plus, Music4, Clock, Mic2, Loader2, RefreshCw } from "lucide-react";
import NewProjectModal from "@/components/projects/NewProjectModal";
import { createClient } from "@/lib/supabase/client";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Función para cargar proyectos
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error cargando:", error);
    if (data) setProjects(data);
    setLoading(false);
  };

  // Cargar al iniciar
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} p-6 md:p-10 relative`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-bold text-white tracking-tight">Studio Hub</h1>
             <p className="text-sm text-zinc-500">Tus mezclas activas.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wide"
        >
          <Plus size={18} /> Nuevo Proyecto
        </button>
      </div>

      {/* GRID DE PROYECTOS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
           <Loader2 className="animate-spin text-amber-500" size={32} />
           <p className="text-xs uppercase tracking-widest">Cargando librería...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
           <Music4 className="mx-auto mb-4 opacity-20" size={48} />
           <h3 className="text-lg font-bold text-white mb-2">Está muy silencioso aquí...</h3>
           <p className="text-zinc-500 text-sm mb-6">Sube tu primera maqueta para empezar.</p>
           <button onClick={() => setIsModalOpen(true)} className="text-amber-500 hover:underline text-sm font-bold">Subir ahora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group relative bg-[#0F1112] border border-zinc-800 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-colors">
                   <Music4 size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full border bg-zinc-900 border-zinc-700 text-zinc-400">
                  {project.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors truncate">{project.title}</h3>
              <p className="text-sm text-zinc-500 mb-6">{project.artist}</p>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                    <Clock size={12} />
                    <span>Reciente</span>
                 </div>
                 <div className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50">
                    <Mic2 size={10} />
                    <span>{project.version}</span>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* MODAL (Pasamos fetchProjects para recargar al subir) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)} />
           <div className="relative z-10 w-full max-w-md">
              <NewProjectModal onClose={() => { setIsModalOpen(false); fetchProjects(); }} />
           </div>
        </div>
      )}
    </div>
  );
}