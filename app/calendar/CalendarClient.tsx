"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addWeeks,
  differenceInMinutes,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase as sb } from "@/lib/supabaseClient";

// --- IMPORTACIÓN DE COMPONENTES ATOMIZADOS ---
import { Logo } from "@/components/ui/Logo";
import { SessionModal } from "@/components/calendar/SessionModal";
import { QuickCreatePanel } from "@/components/calendar/QuickCreatePanel";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { ClientModal } from "@/components/calendar/ClientModal";

// --- CONFIGURACIÓN FIJA ---
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";
const START_HOUR = 0;
const END_HOUR = 28;
const SLOT_MIN = 30;
const PX_PER_HOUR = 60;

// --- HELPERS LÓGICOS ---
function dayKey(date: Date) { return format(date, "yyyy-MM-dd"); }
function snapMinutes(mins: number) { return Math.round(mins / SLOT_MIN) * SLOT_MIN; }

function clampToBounds(date: Date) {
  const min = new Date(date); min.setHours(START_HOUR, 0, 0, 0);
  const max = new Date(date); max.setHours(END_HOUR, 0, 0, 0);
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export default function CalendarClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Vista
  const [viewMode, setViewMode] = useState<"day" | "two" | "week">("day");
  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(new Date()));
  const [roomFilter, setRoomFilter] = useState<string>("all");

  // Estados de Formulario / Modales
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [color, setColor] = useState("#10b981");

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Resize Refs
  const [isResizing, setIsResizing] = useState(false);
  const [resizeBookingId, setResizeBookingId] = useState<string | null>(null);
  const resizeStartYRef = useRef(0);
  const resizeOriginalEndRef = useRef<Date | null>(null);
  const resizePreviewEndRef = useRef<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // --- LÓGICA DE DATOS (SUPABASE) ---
  const loadAll = useCallback(async () => {
    if (!sb) return;
    const [roomsRes, staffRes, servicesRes, clientsRes] = await Promise.all([
      sb.from("rooms").select("id,name").eq("org_id", ORG_ID).order("created_at"),
      sb.from("staff").select("id,name,role").eq("org_id", ORG_ID).eq("active", true),
      sb.from("services").select("id,name,duration_minutes,price").eq("org_id", ORG_ID).eq("active", true),
      sb.from("clients").select("id,name,email,phone,avatar_url").order("created_at", { ascending: false })
    ]);
    setRooms(roomsRes.data || []);
    setStaff(staffRes.data || []);
    setServices(servicesRes.data || []);
    setClients(clientsRes.data || []);
  }, []);

  const loadBookingsForRange = useCallback(async (start: Date, daysCount: number) => {
    if (!sb) return;
    const rangeStart = startOfDay(start);
    const rangeEnd = endOfDay(addDays(start, daysCount - 1));
    const { data } = await sb.from("bookings").select().eq("org_id", ORG_ID)
      .gte("start_at", rangeStart.toISOString()).lte("start_at", rangeEnd.toISOString());
    setBookings(data || []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const start = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const days = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    loadBookingsForRange(start, days);
  }, [viewMode, viewStart, loadBookingsForRange]);

  // --- HANDLERS LÓGICOS ---
  const checkOverlap = (targetRoomId: string, start: Date, end: Date, ignoreId?: string) => {
    return bookings.find(b => b.room_id === targetRoomId && b.id !== ignoreId && start < new Date(b.end_at) && end > new Date(b.start_at));
  };

  const createBooking = async () => {
    if (!roomId || !serviceId || !clientName.trim() || !startAt) return alert("Faltan datos.");
    const duration = services.find(s => s.id === serviceId)?.duration_minutes || 60;
    const start = new Date(startAt);
    const end = new Date(start.getTime() + duration * 60000);
    if (checkOverlap(roomId, start, end)) return alert("¡Sala ocupada!");
    
    await sb.from("bookings").insert([{
      org_id: ORG_ID, room_id: roomId, service_id: serviceId, staff_id: staffId || null,
      client_name: clientName, start_at: start.toISOString(), end_at: end.toISOString(), color, payment_status: "pending"
    }]);
    loadBookingsForRange(viewStart, viewMode === "week" ? 7 : 1);
  };

  const onDragEnd = async (event: any) => {
    const { active, over, delta } = event;
    if (!over) return;
    const booking = bookings.find(b => b.id === active.id);
    const [newRoomId, dayIdx] = String(over.id).split("|");
    const newStart = new Date(viewDays[Number(dayIdx)]);
    newStart.setHours(new Date(booking.start_at).getHours(), new Date(booking.start_at).getMinutes() + snapMinutes(delta.y));
    const duration = differenceInMinutes(new Date(booking.end_at), new Date(booking.start_at));
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    
    if (checkOverlap(newRoomId, newStart, newEnd, booking.id)) return alert("Espacio ocupado");
    await sb.from("bookings").update({ room_id: newRoomId, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }).eq("id", booking.id);
    loadBookingsForRange(viewStart, 1);
  };

  // --- MEMOS ---
  const viewDays = useMemo(() => {
    const start = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : startOfDay(viewStart);
    return Array.from({ length: viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1 }).map((_, i) => addDays(start, i));
  }, [viewMode, viewStart]);

  const bookingsIndex = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const key = `${b.room_id}|${dayKey(new Date(b.start_at))}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [bookings]);

  const stats = useMemo(() => {
    const collected = bookings.reduce((acc, b) => acc + (b.payment_status === "paid" ? (services.find(s => s.id === b.service_id)?.price || 0) : 0), 0);
    const estimated = bookings.reduce((acc, b) => acc + (services.find(s => s.id === b.service_id)?.price || 0), 0);
    const hours = bookings.reduce((acc, b) => acc + differenceInMinutes(new Date(b.end_at), new Date(b.start_at)), 0) / 60;
    return { collectedRevenue: collected, estimatedRevenue: estimated, totalHours: hours.toFixed(1), totalCount: bookings.length };
  }, [bookings, services]);

  const visibleRooms = useMemo(() => roomFilter === "all" ? rooms : rooms.filter(r => r.id === roomFilter), [rooms, roomFilter]);
  const headerRangeLabel = useMemo(() => format(viewDays[0], "d 'de' MMMM yyyy", { locale: es }), [viewDays]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] p-5 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* --- CABECERA --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div><Logo size="text-4xl" /><p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mt-1 font-black">Consola de Operaciones de Audio</p></div>
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
            <button onClick={() => setViewStart(d => addDays(d, -1))} className="p-2 text-zinc-400"> ◀ </button>
            <div className="px-6 text-center border-x border-zinc-800/50"><span className="text-[9px] block text-zinc-600 font-bold mb-0.5 uppercase">Timeline</span><span className="text-sm font-bold">{headerRangeLabel}</span></div>
            <button onClick={() => setViewStart(d => addDays(d, 1))} className="p-2 text-zinc-400"> ▶ </button>
          </div>
          <button onClick={() => setStartAt(new Date().toISOString().slice(0, 16))} className="bg-emerald-500 text-black px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">+ Nueva Reserva</button>
        </div>

        {/* --- BARRA TÉCNICA Y STATS --- */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-zinc-900/30 p-3 rounded-[28px] border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-zinc-800/40 px-4 py-2 rounded-xl border border-zinc-700/30">
            <span className="text-[9px] font-black text-zinc-500 uppercase">Estudio:</span>
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-200 outline-none">
              <option value="all" className="bg-[#0c0c0e]">TODOS</option>
              {rooms.map(r => <option key={r.id} value={r.id} className="bg-[#0c0c0e]">{r.name}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowStats(!showStats)} className="p-3 bg-zinc-800/40 rounded-xl">📊</button>
          <button onClick={() => setShowClientModal(true)} className="p-3 bg-zinc-800/40 rounded-xl">👤</button>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px]">
              <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Caja Real</p>
              <h4 className="text-3xl font-light text-emerald-400">${stats.collectedRevenue.toLocaleString('es-CL')}</h4>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px]">
              <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Ocupación</p>
              <h4 className="text-3xl font-light text-white">{stats.totalHours} Horas</h4>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px]">
               <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Estado de Cobros</p>
               <h4 className="text-3xl font-light text-white">{stats.estimatedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.estimatedRevenue) * 100) : 0}%</h4>
            </div>
          </div>
        )}

        {/* --- COMPONENTES ATOMIZADOS --- */}
        <QuickCreatePanel 
          roomId={roomId} setRoomId={setRoomId} serviceId={serviceId} setServiceId={setServiceId} staffId={staffId} setStaffId={setStaffId}
          startAt={startAt} setStartAt={setStartAt} clientName={clientName} handleClientNameChange={setClientName}
          notes={notes} setNotes={setNotes} color={color} setColor={setColor} rooms={rooms} services={services} staff={staff} onCreate={createBooking}
        />

        <CalendarGrid 
          viewDays={viewDays} hours={hours} START_HOUR={START_HOUR} visibleRooms={visibleRooms} bookingsIndex={bookingsIndex}
          clientMap={new Map(clients.map(c => [c.id, c]))} serviceMap={new Map(services.map(s => [s.id, s]))}
          onDragEnd={onDragEnd} onEdit={setSelectedBooking} onResize={() => {}} dayKey={dayKey}
        />

        {selectedBooking && (
          <SessionModal 
            booking={selectedBooking} clientMap={new Map(clients.map(c => [c.id, c]))} rooms={rooms} editRoomId={editRoomId} editColor={editColor}
            onClose={() => setSelectedBooking(null)} onDelete={() => {}} onSave={() => {}} onTogglePayment={() => {}} 
            onStartSession={() => {}} onStopSession={() => {}} setEditRoomId={setEditRoomId} setEditColor={setEditColor}
          />
        )}

        {showClientModal && (
          <ClientModal 
            onClose={() => setShowClientModal(false)} name={newClientName} setName={setNewClientName}
            phone={newClientPhone} setPhone={setNewClientPhone} onCreate={() => {}}
          />
        )}
      </div>
    </div>
  );
}