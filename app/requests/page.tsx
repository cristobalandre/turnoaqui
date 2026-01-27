"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Play, User, Calendar as CalendarIcon, Clock, 
  MessageSquare, Check, X, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(name)')
      .order('created_at', { ascending: false });
    
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Función para actualizar el estado de la reserva
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: status }) // Usamos esta columna para el estado
      .eq('id', id);
    
    if (!error) fetchRequests();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-8 font-sans relative overflow-hidden">
      
      {/* 🟢 LUMINOSIDAD ESMERALDA DE FONDO */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors mb-4 text-zinc-500">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Solicitudes <span className="text-zinc-600 italic">Web</span>
            </h1>
          </div>
        </div>

        {/* LISTADO DE SOLICITUDES */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-xs tracking-widest animate-pulse">SINCRONIZANDO CONSOLA...</div>
          ) : requests.map((req) => (
            <div 
              key={req.id} 
              className="group bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Info Cliente */}
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800/30 flex items-center justify-center border border-zinc-700/20 group-hover:border-emerald-500/50 transition-colors">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium text-lg">{req.client_name}</h3>
                      {/* Badge de estado */}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        req.payment_status === 'confirmed' ? 'border-emerald-500/50 text-emerald-400' : 
                        req.payment_status === 'rejected' ? 'border-red-500/50 text-red-400' : 'border-zinc-700 text-zinc-500'
                      }`}>
                        {req.payment_status === 'confirmed' ? 'CONFIRMADA' : req.payment_status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {format(new Date(req.start_at), "d 'de' MMMM", { locale: es })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {format(new Date(req.start_at), "HH:mm")}</span>
                    </div>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="flex items-center gap-3">
                  {/* PLAY AUDIO (Minimalist Grey) */}
                  {req.reference_url && (
                    <a 
                      href={req.reference_url} 
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/40 text-zinc-300 hover:bg-white hover:text-black transition-all border border-zinc-700/50 text-xs font-semibold"
                    >
                      <Play className="h-3 w-3 fill-current" /> Escuchar
                    </a>
                  )}

                  {/* BOTONES DE ACCIÓN (Confirmar / Rechazar) */}
                  <div className="flex border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl">
                    <button 
                      onClick={() => updateStatus(req.id, 'confirmed')}
                      className="p-2.5 bg-zinc-900/80 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all border-r border-zinc-800/50"
                      title="Confirmar cita"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => updateStatus(req.id, 'rejected')}
                      className="p-2.5 bg-zinc-900/80 hover:bg-red-500/20 hover:text-red-400 transition-all"
                      title="Rechazar cita"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notas y WhatsApp */}
              {req.notes && (
                <div className="mt-5 pt-4 border-t border-zinc-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600 italic">
                    <MessageSquare className="h-3 w-3" />
                    <p>{req.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}