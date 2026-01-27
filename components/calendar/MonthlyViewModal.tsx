"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, isSameMonth, isSameDay, addMonths, subMonths 
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient"; // Importamos cliente directo
import { Logo } from "@/components/ui/Logo";

interface MonthlyViewModalProps {
  onClose: () => void;
  rooms: any[];
  orgId: string; // Necesitamos el ID para buscar
}

export const MonthlyViewModal = ({ onClose, rooms, orgId }: MonthlyViewModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyBookings, setMonthlyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- 1. CARGA DE DATOS INDEPENDIENTE (AUDITORÍA) ---
  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // Buscamos un poco antes y después para llenar la grilla visualmente
      const gridStart = startOfWeek(start, { weekStartsOn: 1 });
      const gridEnd = endOfWeek(end, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("org_id", orgId)
        .gte("start_at", gridStart.toISOString())
        .lte("end_at", gridEnd.toISOString());

      if (!error && data) {
        setMonthlyBookings(data);
      }
      setLoading(false);
    };

    if (orgId) fetchMonthData();
  }, [currentMonth, orgId]);

  // --- 2. CÁLCULOS DE LA GRILLA ---
  const { days, headerMonth } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let daysArr = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        daysArr.push({
          date: day,
          formatted: format(day, "d"),
          isCurrentMonth: isSameMonth(day, monthStart),
          isToday: isSameDay(day, new Date())
        });
        day = addDays(day, 1);
      }
      rows.push(daysArr);
      daysArr = [];
    }
    return { days: rows, headerMonth: format(currentMonth, "MMMM yyyy", { locale: es }) };
  }, [currentMonth]);

  const getBookingsForDay = (date: Date) => {
    return monthlyBookings.filter(b => isSameDay(new Date(b.start_at), date));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#09090b]/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      {/* Fondo con Aura Decorativa */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      
      <div className="bg-[#0c0c0e] border border-zinc-800/80 w-full max-w-7xl h-[90vh] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/20 gap-4">
          <div>
             <Logo size="text-2xl" />
             <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mt-1">Auditoría Mensual</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800/50 shadow-lg">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> ◀ </button>
                <div className="px-6 py-2 text-center min-w-[180px]">
                  <span className="text-lg font-black text-white capitalize block leading-none">{headerMonth}</span>
                  {loading && <span className="text-[9px] text-emerald-500 animate-pulse">Cargando datos...</span>}
                </div>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> ▶ </button>
            </div>
            <button onClick={onClose} className="p-4 bg-zinc-800/50 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all text-zinc-400 font-bold">✕ CERRAR</button>
          </div>
        </div>

        {/* --- GRILLA --- */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-7 gap-2 h-full min-h-[600px]">
            {/* Encabezados */}
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 pb-2">{d}</div>
            ))}

            {/* Celdas */}
            {days.map((row, i) => (
              <React.Fragment key={i}>
                {row.map((dayObj, j) => {
                  const dayBookings = getBookingsForDay(dayObj.date);
                  // Ordenar: primero los pagados para que se vea bonito
                  dayBookings.sort((a, b) => (a.payment_status === 'paid' ? -1 : 1));

                  return (
                    <div key={j} className={`rounded-2xl border p-2 flex flex-col gap-1 transition-all relative overflow-hidden min-h-[100px] ${!dayObj.isCurrentMonth ? 'bg-zinc-900/20 border-zinc-800/20 opacity-30' : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/60'} ${dayObj.isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-500/5' : ''}`}>
                      <span className={`text-xs font-black mb-1 ${dayObj.isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>{dayObj.formatted}</span>
                      
                      <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
                        {dayBookings.map(b => {
                            const roomName = rooms.find(r => r.id === b.room_id)?.name || "?";
                            const isPaid = b.payment_status === 'paid';
                            return (
                            <div key={b.id} 
                                 className={`px-2 py-1.5 rounded-lg flex items-center justify-between text-[9px] font-bold transition-all border border-white/5 ${isPaid ? 'opacity-100' : 'opacity-60 grayscale'}`}
                                 style={{ backgroundColor: b.color || "#27272a", color: 'white' }}>
                                <div className="flex flex-col truncate leading-tight">
                                    <span className="truncate">{b.client_name}</span>
                                    <span className="opacity-70 text-[8px]">{format(new Date(b.start_at), "HH:mm")} · {roomName}</span>
                                </div>
                                {isPaid && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981]" />}
                                {!isPaid && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
                            </div>
                        )})}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};