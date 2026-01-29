"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowLeft, Plus, Music4, Clock, Mic2, AlertCircle } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });

// --- 1. LÓGICA DE TIEMPO RESTANTE ---
const getTimeLeft = (createdDate: string) => {
  const created = new Date(createdDate);
  // Vida útil: 3 días (72 horas)
  const expires = new Date(created.getTime() + (3 * 24 * 60 * 60 * 1000)); 
  const now = new Date();
  const diff = expires.getTime() - now.getTime();

  // Si ya pasó el tiempo
  if (diff <= 0) return { 
    text: "Expirado", 
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    icon: <AlertCircle size={12} />
  };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  // Si queda menos de 1 día (Urgencia)
  if (hours < 24) return { 
    text: `${hours}h restantes`, 
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20 animate-pulse",
    icon: <Clock size={12} />
  };

  // Estado normal
  return { 
    text: `${Math.floor(hours / 24)}d restantes`, 
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: <Clock size={12} />
  };
};

// --- 2. DATOS DE EJEMPLO (Con fechas reales para probar) ---
const today = new Date();
const MOCK_PROJECTS = [
  { 
    id: "1", 
    title: "Abigail Lane - EP", 
    artist: "The Insects", 
    status: "En Revisión", 
    version: "v2.4", 
    // Creado hace 2 horas (Le quedan 2 días y pico)
    created_at: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: "2", 
    title: "Jellyfish Garden", 
    artist: "Neon Creative", 
    status: "Aprobado", 
    version: "v1.0", 
    // Creado hace 2 días (Le queda menos de 24h -> Alerta Naranja)
    created_at: new Date(today.getTime() - 49 * 60 * 60 * 1000).toISOString() 
  },
  { 
    id: "3", 
    title: "Trap Beat Pack 2026", 
    artist: "Richie Bennett", 
    status: "Borrador", 
    version: "v0.1", 
    // Creado hace 4 días (Ya expiró -> Rojo)
    created_at: new Date(today.getTime() - 96 * 60 * 60 * 1000).toISOString() 
  },
];

export default function ProjectsPage() {
  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} p-6 md:p-10`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-bold text-white tracking-tight">Studio Hub</h1>
             <p className="text-sm text-zinc-500">Gestión de entregas y feedback.</p>
          </div>
        </div>
        
        {/* Botón Nuevo Proyecto */}
        {/* Nota: Aquí deberías conectar el onClick para abrir tu NewProjectModal */}
        <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wide">
          <Plus size={18} /> Nuevo Proyecto
        </button>
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {MOCK_PROJECTS.map((project) => {
          // Calculamos el estado de vida del archivo
          const expiration = getTimeLeft(project.created_at);

          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="group relative bg-[#0F1112] border border-zinc-800 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer">
              
              {/* Encabezado Tarjeta */}
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-colors">
                   <Music4 size={24} />
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border bg-zinc-900 border-zinc-700 text-zinc-400`}>
                  {project.status}
                </span>
              </div>

              {/* Título y Artista */}
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors truncate">{project.title}</h3>
              <p className="text-sm text-zinc-500 mb-6">{project.artist}</p>

              {/* Footer con Alerta de Expiración */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                 
                 {/* Badge de Tiempo Restante (Dinámico) */}
                 <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border ${expiration.color}`}>
                    {expiration.icon}
                    <span>{expiration.text}</span>
                 </div>

                 {/* Versión */}
                 <div className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50">
                    <Mic2 size={10} />
                    <span>{project.version}</span>
                 </div>

              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}