"use client";

import React from 'react';

interface QuickCreatePanelProps {
  roomId: string;
  setRoomId: (id: string) => void;
  serviceId: string;
  setServiceId: (id: string) => void;
  staffId: string;
  setStaffId: (id: string) => void;
  startAt: string;
  setStartAt: (val: string) => void;
  clientName: string;
  handleClientNameChange: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  rooms: any[];
  services: any[];
  staff: any[];
  onCreate: () => void;
}

export const QuickCreatePanel = ({
  roomId, setRoomId,
  serviceId, setServiceId,
  staffId, setStaffId,
  startAt, setStartAt,
  clientName, handleClientNameChange,
  notes, setNotes,
  color, setColor,
  rooms, services, staff,
  onCreate
}: QuickCreatePanelProps) => {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 mb-8 backdrop-blur-sm shadow-2xl relative">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold">
          <option value="">ESTUDIO / SALA</option>
          {rooms.map(r => <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>)}
        </select>
        
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold">
          <option value="">SERVICIO</option>
          {services.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>)}
        </select>

        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold">
          <option value="">STAFF / PRODUCTOR</option>
          {staff.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>)}
        </select>

        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-4 text-[11px] text-white outline-none focus:border-emerald-500/50" />
        
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center px-4">
          <input list="client-suggestions" placeholder="ARTISTA / CLIENTE..." value={clientName} onChange={(e) => handleClientNameChange(e.target.value)} className="bg-transparent border-none text-sm text-white font-black focus:ring-0 w-full placeholder:text-emerald-900/30" />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <input placeholder="NOTAS DE OPERACIÓN (EQUIPO, REQUERIMIENTOS...)" value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 bg-zinc-800/10 border border-zinc-700/10 rounded-2xl px-6 py-4 text-xs text-zinc-500 focus:text-white outline-none transition-all font-medium" />
        
        <div className="relative w-12 h-12 rounded-full border-2 border-zinc-800 shadow-xl transition-all hover:scale-110 flex-shrink-0" style={{ backgroundColor: color }}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Identificador visual" />
          <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
        </div>

        <button onClick={onCreate} className="px-12 py-4 bg-white text-black text-[10px] font-black tracking-[0.2em] rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl uppercase">Agendar</button>
      </div>
    </div>
  );
};