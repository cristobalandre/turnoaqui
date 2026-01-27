"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Play, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  MessageSquare, 
  MoreHorizontal,
  ExternalLink,
  Music,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, rooms(name)')
        .order('created_at', { ascending: false });
      
      if (data) setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-8 font-sans">
      
      {/* HEADER MINIMALISTA */}
      <div className="max-w-5xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-3 w-3" /> Volver
          </Link>
          <h1 className="text-3xl font-light text-white tracking-tight">Solicitudes <span className="text-zinc-600">Web</span></h1>
        </div>
        <div className="flex gap-3">
          {/* BOTÓN GREY ESTILO GEMINI */}
          <button className="px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-300">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-20 animate-pulse">Cargando consola...</div>
        ) : requests.map((req) => (
          <div 
            key={req.id} 
            className="group relative bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 hover:bg-zinc-900/40 hover:border-zinc-700/50 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Info del Cliente */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/30 group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">{req.client_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {format(new Date(req.start_at), "d 'de' MMMM", { locale: es })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(req.start_at), "HH:mm")}</span>
                  </div>
                </div>
              </div>

              {/* ACCIONES AUDIO FIRST (Minimalist Grey) */}
              <div className="flex items-center gap-2">
                
                {/* BOTÓN DE PLAY (Si hay maqueta) */}
                {req.reference_url ? (
                  <a 
                    href={req.reference_url} 
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-zinc-300 hover:bg-white hover:text-black transition-all duration-300 border border-zinc-700/50 text-xs font-semibold"
                  >
                    <Play className="h-3 w-3 fill-current" /> Escuchar Maqueta
                  </a>
                ) : (
                  <span className="px-4 py-2 text-[10px] text-zinc-700 border border-zinc-800/30 rounded-full italic">Sin referencia</span>
                )}

                {/* BOTÓN MÁS OPCIONES */}
                <button className="p-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notas Rápidas */}
            {req.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-800/30 flex items-center gap-2 text-xs text-zinc-600">
                <MessageSquare className="h-3 w-3" />
                <p className="truncate">{req.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}