"use client";

import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
// ✅ IMPORTAMOS LOS NUEVOS ICONOS
import { IconPlay, IconStop, IconTrash, IconUser } from "@/components/ui/VectorIcons";

interface SessionModalProps {
  booking: any;
  clientMap: Map<string, any>;
  rooms: any[];
  editRoomId: string;
  editColor: string;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  onTogglePayment: () => void;
  onStartSession: () => void;
  onStopSession: () => void;
  setEditRoomId: (id: string) => void;
  setEditColor: (color: string) => void;
}

export const SessionModal = ({
  booking,
  clientMap,
  rooms,
  editRoomId,
  editColor,
  onClose,
  onDelete,
  onSave,
  onTogglePayment,
  onStartSession,
  onStopSession,
  setEditRoomId,
  setEditColor,
}: SessionModalProps) => {
  const client = booking.client_id ? clientMap.get(booking.client_id) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/70 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-[40px] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30" />
        
        <div className="flex items-center gap-6 mb-10">
           <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex-shrink-0 shadow-2xl ring-4 ring-emerald-500/5 flex items-center justify-center">
              {client?.avatar_url ? (
                <img src={client.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                // ✅ ICONO DE USUARIO VECTORIAL
                <IconUser size={40} className="text-zinc-600 opacity-50" />
              )}
           </div>
           <div className="flex-1">
             <h2 className="text-3xl text-white font-light tracking-tight">{booking.client_name}</h2>
             <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[9px] text-zinc-400 font-black tracking-widest uppercase">ID: {booking.id.slice(0,8)}</span>
                {booking.service_id && <span className="text-[10px] text-zinc-600 font-bold">· Servicio Activo</span>}
             </div>
           </div>
           <button onClick={onTogglePayment} className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all shadow-xl ${booking.payment_status === 'paid' ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-red-500 text-white border border-red-500/50 shadow-red-500/10'}`}>
            {booking.payment_status === 'paid' ? '✓ COBRADO' : 'PENDIENTE'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
           <button onClick={onStartSession} className="py-5 bg-zinc-900 border border-zinc-800 text-white rounded-3xl text-[9px] font-black tracking-[0.2em] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-3 group">
             {/* ✅ ICONO PLAY VECTORIAL */}
             <IconPlay size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
             INICIAR SESIÓN
           </button>
           <button onClick={onStopSession} className="py-5 bg-zinc-900 border border-zinc-800 text-white rounded-3xl text-[9px] font-black tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 transition-all flex flex-col items-center gap-3 group">
             {/* ✅ ICONO STOP VECTORIAL */}
             <IconStop size={24} className="text-red-500 group-hover:scale-110 transition-transform" />
             FINALIZAR
           </button>
        </div>

        <div className="space-y-4 bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800/50 mb-10">
           <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4">
             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Mover Estudio:</span>
             <select value={editRoomId || booking.room_id} onChange={e => setEditRoomId(e.target.value)} className="bg-transparent text-white text-sm font-black outline-none cursor-pointer">
                {rooms.map(r => <option key={r.id} value={r.id} className="bg-zinc-900 text-white">{r.name}</option>)}
             </select>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Color de Tarjeta:</span>
             <div className="w-8 h-8 rounded-full border border-zinc-700 shadow-inner overflow-hidden transition-transform hover:scale-110" style={{ backgroundColor: editColor }}>
                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
             </div>
           </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onDelete} className="p-5 bg-red-500/10 text-red-500 rounded-3xl hover:bg-red-500/20 transition-all group">
            {/* ✅ ICONO BASURA VECTORIAL */}
            <IconTrash size={24} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={onSave} className="flex-1 py-6 bg-white text-black text-[11px] font-black tracking-[0.3em] rounded-3xl hover:bg-emerald-400 transition-all uppercase shadow-2xl active:scale-95">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};