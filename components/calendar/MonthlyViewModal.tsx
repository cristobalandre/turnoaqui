"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, isSameMonth, isSameDay, addMonths, subMonths 
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { Logo } from "@/components/ui/Logo";
import { IconArrowLeft, IconArrowRight, IconX, IconUser } from "@/components/ui/VectorIcons";

interface MonthlyViewModalProps {
  onClose: () => void;
  rooms: any[];
  orgId: string;
}

export const MonthlyViewModal = ({ onClose, rooms, orgId }: MonthlyViewModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyBookings, setMonthlyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para el modal de detalles
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
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

  // --- LÓGICA DE COBRO RÁPIDO (NUEVO) ---
  const handleTogglePayment = async (bookingId: string, currentStatus: string | null) => {
    const isPaid = currentStatus === 'paid';
    const nextStatus = isPaid ? 'pending' : 'paid';

    // ⚠️ ADVERTENCIA DE SEGURIDAD
    if (!isPaid) {
        const confirmPayment = window.confirm("⚠️ ¿Confirmas que recibiste el dinero?\n\nCuidado, revisa bien si el cliente ha pagado antes de marcarlo.");
        if (!confirmPayment) return; // Si cancela, no hacemos nada
    }

    // Actualizamos en Supabase
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: nextStatus })
      .eq('id', bookingId);

    if (error) {
      alert("Error al actualizar: " + error.message);
      return;
    }

    // Actualizamos el estado local instantáneamente para ver el cambio de color
    setMonthlyBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, payment_status: nextStatus } : b
    ));
  };

  // --- CÁLCULOS DE LA GRILLA ---
  const { days, headerMonth } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
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

  // --- FILTRAR RESERVAS (DETALLE) ---
  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return [];
    return getBookingsForDay(selectedDay).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [selectedDay, monthlyBookings]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#09090b]/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      
      <div className="bg-[#0c0c0e] border border-zinc-800/80 w-full max-w-7xl h-[90vh] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/20 gap-4">
          <div>
             <Logo size="text-2xl" />
             <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mt-1">Auditoría Mensual</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50 shadow-lg">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> 
                  <IconArrowLeft size={20} /> 
                </button>
                
                <div className="px-4 text-center min-w-[160px]">
                  <span className="text-lg font-black text-white capitalize block leading-none">{headerMonth}</span>
                  {loading && <span className="text-[9px] text-emerald-500 animate-pulse">Sincronizando...</span>}
                </div>

                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> 
                  <IconArrowRight size={20} /> 
                </button>
            </div>
            
            <button onClick={onClose} className="p-3 bg-zinc-800/30 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all text-zinc-500">
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* --- GRILLA MENSUAL --- */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-7 gap-2 h-full min-h-[600px]">
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 pb-2">{d}</div>
            ))}

            {days.map((row, i) => (
              <React.Fragment key={i}>
                {row.map((dayObj, j) => {
                  const dayBookings = getBookingsForDay(dayObj.date);
                  
                  return (
                    <div 
                      key={j} 
                      onClick={() => setSelectedDay(dayObj.date)}
                      className={`
                        rounded-2xl border p-3 flex flex-col gap-2 transition-all relative overflow-hidden min-h-[100px] cursor-pointer group
                        ${!dayObj.isCurrentMonth ? 'bg-zinc-900/20 border-zinc-800/20 opacity-30' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-emerald-500/50 hover:bg-zinc-900/80'} 
                        ${dayObj.isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-500/5' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-black ${dayObj.isToday ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{dayObj.formatted}</span>
                        {dayBookings.length > 0 && (
                           <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900/50 px-1.5 rounded-md">{dayBookings.length} ses.</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
                        {dayBookings.slice(0, 3).map(b => {
                            const isPaid = b.payment_status === 'paid';
                            return (
                            <div key={b.id} className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPaid ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`} />
                                <span className={`text-[9px] font-bold truncate ${isPaid ? 'text-zinc-300' : 'text-zinc-500'}`}>{b.client_name}</span>
                            </div>
                        )})}
                        {dayBookings.length > 3 && (
                          <span className="text-[8px] text-zinc-600 pl-3">+ {dayBookings.length - 3} más...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODAL DE DETALLE DEL DÍA --- */}
      {selectedDay && (
        <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200" onClick={() => setSelectedDay(null)}>
          <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
              <div>
                <h3 className="text-2xl text-white font-light tracking-tight capitalize">{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h3>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Detalle de Operaciones</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white transition-all"><IconX size={18} /></button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {selectedDayBookings.length === 0 ? (
                <div className="py-10 text-center text-zinc-600 text-sm">No hay sesiones registradas este día.</div>
              ) : (
                selectedDayBookings.map((b) => {
                  const roomName = rooms.find(r => r.id === b.room_id)?.name || "Sala ?";
                  const isPaid = b.payment_status === 'paid';
                  
                  return (
                    <div key={b.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 hover:border-zinc-700 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-zinc-800 rounded-full text-zinc-400"><IconUser size={16} /></div>
                           <div>
                             <h4 className="text-sm font-bold text-white leading-none">{b.client_name}</h4>
                             <span className="text-[10px] text-zinc-500">{roomName}</span>
                           </div>
                        </div>
                        
                        {/* ✅ BOTÓN DE PAGO INTERACTIVO */}
                        <button 
                          onClick={() => handleTogglePayment(b.id, b.payment_status)}
                          className={`
                            px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95
                            ${isPaid 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40'}
                          `}
                          title={isPaid ? "Marcar como pendiente" : "Marcar como PAGADO"}
                        >
                          {isPaid ? '✓ PAGADO' : 'PENDIENTE'}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 bg-black/20 p-2 rounded-lg mb-2">
                        <span>🕒 {format(new Date(b.start_at), "HH:mm")} - {format(new Date(b.end_at), "HH:mm")}</span>
                      </div>

                      {b.notes && (
                        <div className="text-[10px] text-zinc-400 italic border-l-2 border-zinc-700 pl-2 mt-2">
                          "{b.notes}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};