"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { 
  ArrowLeft, Share2, Download, Clock, CheckCircle2, Plus 
} from "lucide-react";
import { useState } from "react";
// ✅ 1. Importamos el Reproductor Real
import { AudioPlayer } from "@/components/projects/AudioPlayer";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectDetailPage() {
  // Nota: Ya no necesitamos el estado 'isPlaying' aquí porque el AudioPlayer lo maneja internamente.
  const [activeVersion, setActiveVersion] = useState(2);

  // Mock de versiones
  const versions = [
    { id: 2, name: "Versión 2 - Voces Arriba", date: "Hoy, 10:30 AM", active: true },
    { id: 1, name: "Versión 1 - Mix Inicial", date: "Ayer, 4:20 PM", active: false },
  ];

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} flex flex-col`}>
      
      {/* --- HEADER SUPERIOR --- */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Abigail Lane - EP</h1>
            <p className="text-xs text-zinc-500 mt-1">Cliente: The Insects</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:text-white transition-colors">
              <Share2 size={14} /> Compartir
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10">
              <Download size={14} /> Descargar
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- COLUMNA IZQUIERDA: PLAYER & WAVEFORM --- */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
           
           {/* Selector de Versión Activa */}
           <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider mb-4">
                 <CheckCircle2 size={12} /> Revisión Activa
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Here Comes the Moon.mp3</h2>
              <p className="text-zinc-500 text-sm">Subido por Chris Andrez • Hace 2 horas</p>
           </div>

           {/* 🌊 EL WAVEFORM REAL (WaveSurfer) */}
           <div className="mb-8">
              {/* Aquí pasamos una URL de prueba. Cuando conectes Supabase, pasarás la URL real del archivo */}
              <AudioPlayer url="https://www.mfiles.co.uk/mp3-downloads/gs-cd-track2.mp3" />
           </div>

           {/* Caja de Comentarios */}
           <div className="max-w-2xl mx-auto">
              <div className="flex gap-4 items-start">
                 {/* Avatar Placeholder */}
                 <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                 <div className="flex-1">
                    <textarea 
                      placeholder="Escribe un comentario en el segundo 01:24..." 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none h-24"
                    />
                    <div className="flex justify-end mt-2">
                       <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors">
                          Enviar Feedback
                       </button>
                    </div>
                 </div>
              </div>
           </div>

        </main>

        {/* --- COLUMNA DERECHA: HISTORIAL --- */}
        <aside className="w-80 border-l border-zinc-800 bg-[#0c0c0e] p-6 hidden lg:block overflow-y-auto">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Historial de Versiones</h3>
           
           <div className="space-y-4">
              {versions.map((v) => (
                 <div 
                   key={v.id} 
                   onClick={() => setActiveVersion(v.id)}
                   className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                     activeVersion === v.id 
                       ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                       : 'bg-transparent border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded ${activeVersion === v.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                          v{v.id}
                       </span>
                       {activeVersion === v.id && <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                    <h4 className={`text-sm font-bold mb-1 ${activeVersion === v.id ? 'text-white' : 'text-zinc-400'}`}>{v.name}</h4>
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                       <Clock size={10} /> {v.date}
                    </p>
                 </div>
              ))}
           </div>

           <div className="mt-8 pt-8 border-t border-zinc-800">
              <button className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-500 transition-all flex items-center justify-center gap-2">
                 <Plus size={14} /> Subir Nueva Versión
              </button>
           </div>
        </aside>

      </div>
    </div>
  );
}