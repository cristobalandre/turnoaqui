"use client";

import React from 'react';
import { format, isSameDay, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";

// --- Sub-componente: Celda Droppable ---
function DroppableCell({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 rounded-xl transition-all ${isOver ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}`}
    />
  );
}

// --- Sub-componente: Tarjeta Draggable ---
function DraggableBooking({
  booking, topPx, heightPx, label, subLabel, avatarUrl, isRunning, elapsedMin, paymentStatus, onDoubleClick, onResizeStart,
}: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: booking.id });

  const style: React.CSSProperties = {
    position: "absolute",
    left: 6, right: 6,
    top: topPx,
    height: Math.max(heightPx, 35),
    borderRadius: 12,
    background: booking.color || "rgba(34,197,94,0.22)",
    border: paymentStatus === 'paid' ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.15)",
    boxShadow: isDragging ? "0 20px 40px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : 10,
    cursor: "grab",
    backdropFilter: "blur(8px)",
  };

  return (
    <div ref={setNodeRef} style={style} onDoubleClick={onDoubleClick} {...attributes} {...listeners} className="p-3 flex flex-col justify-center overflow-hidden group">
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0">
          {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" /> : <span className="w-full h-full flex items-center justify-center text-xs opacity-30">👤</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black text-white truncate leading-none uppercase">{label}</div>
          <div className="text-[9px] text-white/60 truncate mt-1 font-bold">{subLabel}</div>
        </div>
      </div>
      
      {isRunning && (
        <div className="mt-2 pointer-events-none">
          <div className="text-[8px] font-black text-emerald-400 mb-1 animate-pulse">● EN VIVO: {Math.floor(elapsedMin/60)}h {elapsedMin%60}m</div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-full" /></div>
        </div>
      )}

      {/* Handle de Resize */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e); }}
        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-end justify-center pb-1 group-hover:opacity-100 opacity-0 transition-opacity"
      >
        <div className="w-8 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: LA GRILLA ---
export const CalendarGrid = ({
  viewDays, hours, START_HOUR, visibleRooms, bookingsIndex, clientMap, serviceMap, onDragEnd, onEdit, onResize, dayKey
}: any) => {
  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden backdrop-blur-md shadow-2xl relative">
        <div className="overflow-auto max-h-[60vh] custom-scrollbar">
          <div className="grid relative" style={{ gridTemplateColumns: `85px repeat(${viewDays.length}, minmax(240px, 1fr))`, width: '100%' }}>
            
            {/* Eje de Horas */}
            <div className="sticky left-0 z-40 bg-[#09090b] border-r border-zinc-800/60 shadow-2xl">
              <div className="h-14 border-b border-zinc-800/50 flex items-center justify-center bg-[#0c0c0e]">
                <span className="text-[8px] font-black text-zinc-700 tracking-widest uppercase font-mono italic">Sync</span>
              </div>
              {hours.map((h: number) => (
                <div key={h} className="h-[60px] border-b border-zinc-800/10 flex items-center justify-center relative group/hour">
                  <span className="text-[10px] font-mono font-bold text-zinc-600 group-hover/hour:text-emerald-500 transition-colors">
                    {String(h >= 24 ? h - 24 : h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas de Días */}
            {viewDays.map((day: Date, dayIdx: number) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`relative border-r border-zinc-800/20 ${isToday ? 'bg-emerald-500/[0.01]' : ''}`}>
                  <div className={`sticky top-0 z-30 h-14 border-b border-zinc-800/50 flex flex-col items-center justify-center backdrop-blur-xl ${isToday ? 'bg-emerald-500/10' : 'bg-[#0c0c0e]/95'}`}>
                    <span className={`text-[9px] font-black tracking-widest uppercase ${isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>
                      {format(day, "EEEE", { locale: es })}
                    </span>
                    <span className={`text-lg font-light ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                      {format(day, "dd")}
                    </span>
                  </div>

                  <div className="relative" style={{ height: hours.length * 60 }}>
                    {/* Líneas de guía horizontales */}
                    {hours.map((h: number) => (
                      <div 
                        key={h} 
                        className="absolute w-full border-t border-zinc-800/5 hover:bg-emerald-500/[0.04] transition-all pointer-events-none duration-300" 
                        style={{ top: (h - START_HOUR) * 60, height: 60 }} 
                      />
                    ))}
                    
                    {visibleRooms.map((room: any) => (
                      <div key={room.id} className="absolute inset-0">
                        <DroppableCell id={`${room.id}|${dayIdx}`} />
                        {(bookingsIndex.get(`${room.id}|${dayKey(day)}`) || []).map((b: any) => (
                          <DraggableBooking
                            key={b.id}
                            booking={b}
                            topPx={(new Date(b.start_at).getHours() - START_HOUR) * 60 + (new Date(b.start_at).getMinutes())}
                            heightPx={differenceInMinutes(new Date(b.end_at), new Date(b.start_at))}
                            label={b.client_name || "ARTISTA"}
                            subLabel={b.service_id ? serviceMap.get(b.service_id)?.name || "Sesión" : "Sesión"}
                            avatarUrl={b.client_id ? clientMap.get(b.client_id)?.avatar_url : null}
                            isRunning={Boolean(b.started_at) && !b.ended_at}
                            elapsedMin={b.started_at ? Math.max(0, differenceInMinutes(new Date(), new Date(b.started_at))) : 0}
                            paymentStatus={b.payment_status}
                            onDoubleClick={() => onEdit(b)}
                            onResizeStart={(e: any) => onResize(b, e)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DndContext>
  );
};