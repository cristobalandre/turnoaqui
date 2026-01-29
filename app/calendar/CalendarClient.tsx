"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInMinutes,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase as sb } from "@/lib/supabaseClient";

// Iconos Nuevos para la UI Vistosa
import { Info, MousePointer2, Move, GripHorizontal, LayoutGrid } from "lucide-react"; 

import { Logo } from "@/components/ui/Logo";
import { SessionModal } from "@/components/calendar/SessionModal";
import { QuickCreatePanel } from "@/components/calendar/QuickCreatePanel";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { ClientModal } from "@/components/calendar/ClientModal";
import { MonthlyViewModal } from "@/components/calendar/MonthlyViewModal";
import { IconArrowLeft, IconArrowRight, IconCalendarAudit, IconChart, IconPlus, IconUser } from "@/components/ui/VectorIcons";

import { isPastDateTime, DATE_ERROR_MSG } from "@/lib/validations";

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";
const START_HOUR = 0;
const END_HOUR = 28;
const SLOT_MIN = 30;

function dayKey(date: Date) { return format(date, "yyyy-MM-dd"); }
function snapMinutes(mins: number) { return Math.round(mins / SLOT_MIN) * SLOT_MIN; }

export default function CalendarClient() {
  const [isMounted, setIsMounted] = useState(false);
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<"day" | "two" | "week">("day");
  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(new Date()));
  const [roomFilter, setRoomFilter] = useState<string>("all");

  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState(""); 
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [color, setColor] = useState("#10b981");

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  useEffect(() => { setIsMounted(true); }, []);

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
    const days = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    loadBookingsForRange(viewStart, days);
  }, [viewMode, viewStart, loadBookingsForRange]);

  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const found = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (found) {
       setClientId(found.id);
       setClientPhone(found.phone || "");
    } else {
       setClientId(""); 
    }
  };

  const checkOverlap = (targetRoomId: string, start: Date, end: Date, ignoreId?: string) => {
    return bookings.find(b => b.room_id === targetRoomId && b.id !== ignoreId && start < new Date(b.end_at) && end > new Date(b.start_at));
  };

  const createBooking = async () => {
    if (!roomId || !serviceId || !clientName.trim() || !startAt) return alert("Faltan datos.");
    if (isPastDateTime(startAt)) return alert(DATE_ERROR_MSG);

    const duration = services.find(s => s.id === serviceId)?.duration_minutes || 60;
    const start = new Date(startAt);
    const end = new Date(start.getTime() + duration * 60000);
    if (checkOverlap(roomId, start, end)) return alert("¡Sala ocupada!");
    
    let finalClientId = clientId || null;

    await sb.from("bookings").insert([{
      org_id: ORG_ID, room_id: roomId, service_id: serviceId, staff_id: staffId || null,
      client_id: finalClientId,
      client_name: clientName, client_phone: clientPhone || null,
      start_at: start.toISOString(), end_at: end.toISOString(), color, payment_status: "pending", notes
    }]);
    
    setClientName(""); setClientPhone(""); setNotes(""); setStartAt(""); setClientId("");
    loadBookingsForRange(viewStart, viewMode === "week" ? 7 : 1);
  };

  const openEdit = (b: any) => {
    setSelectedBooking(b);
    setEditRoomId(b.room_id);
    setEditColor(b.color || "#10b981");
  };

  const saveColor = async () => {
    if (!selectedBooking || !sb) return;
    await sb.from("bookings").update({ color: editColor, room_id: editRoomId }).eq("id", selectedBooking.id);
    setSelectedBooking(null);
    loadBookingsForRange(viewStart, 1);
  };

  const deleteBooking = async () => {
    if (!selectedBooking || !sb || !confirm("¿Eliminar reserva?")) return;
    await sb.from("bookings").delete().eq("id", selectedBooking.id);
    setSelectedBooking(null);
    loadBookingsForRange(viewStart, 1);
  };

  const togglePayment = async () => {
    if (!selectedBooking || !sb) return;
    const nextStatus = selectedBooking.payment_status === "paid" ? "pending" : "paid";
    await sb.from("bookings").update({ payment_status: nextStatus }).eq("id", selectedBooking.id);
    setSelectedBooking({ ...selectedBooking, payment_status: nextStatus });
    loadBookingsForRange(viewStart, 1);
  };

  const startSession = async () => {
    if (!selectedBooking || !sb) return;
    const now = new Date().toISOString();
    await sb.from("bookings").update({ started_at: now, ended_at: null }).eq("id", selectedBooking.id);
    setSelectedBooking({ ...selectedBooking, started_at: now, ended_at: null });
    loadBookingsForRange(viewStart, 1);
  };

  const stopSession = async () => {
    if (!selectedBooking || !sb) return;
    const now = new Date().toISOString();
    await sb.from("bookings").update({ ended_at: now }).eq("id", selectedBooking.id);
    setSelectedBooking({ ...selectedBooking, ended_at: now });
    loadBookingsForRange(viewStart, 1);
  };

  const createClientOnly = async () => {
    if (!newClientName.trim() || !sb) return;
    await sb.from("clients").insert([{ name: newClientName, phone: newClientPhone }]);
    setNewClientName(""); setNewClientPhone(""); setShowClientModal(false);
    loadAll();
  };

  const exportToExcel = () => {
    const headers = ["Cliente", "Servicio", "Sala", "Fecha", "Inicio", "Fin", "Precio", "Estado"];
    const rows = bookings.map(b => {
      const s = services.find(x => x.id === b.service_id);
      const r = rooms.find(x => x.id === b.room_id);
      return [
        b.client_name, s?.name, r?.name,
        format(new Date(b.start_at), "dd/MM/yyyy"),
        format(new Date(b.start_at), "HH:mm"),
        format(new Date(b.end_at), "HH:mm"),
        s?.price, b.payment_status
      ].join(";");
    });
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reporte_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDragEnd = async (event: any) => {
    const { active, over, delta } = event;
    if (!over) return;
    const booking = bookings.find(b => b.id === active.id);
    const [newRoomId, dayIdx] = String(over.id).split("|");
    const newStart = new Date(viewDays[Number(dayIdx)]);
    newStart.setHours(new Date(booking.start_at).getHours(), new Date(booking.start_at).getMinutes() + snapMinutes(delta.y));
    
    if (isPastDateTime(newStart)) return alert(DATE_ERROR_MSG);

    const duration = differenceInMinutes(new Date(booking.end_at), new Date(booking.start_at));
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    
    if (checkOverlap(newRoomId, newStart, newEnd, booking.id)) return alert("Espacio ocupado");
    await sb.from("bookings").update({ room_id: newRoomId, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }).eq("id", booking.id);
    loadBookingsForRange(viewStart, 1);
  };

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

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
    const hrs = bookings.reduce((acc, b) => acc + differenceInMinutes(new Date(b.end_at), new Date(b.start_at)), 0) / 60;
    return { collectedRevenue: collected, estimatedRevenue: estimated, totalHours: hrs.toFixed(1), totalCount: bookings.length };
  }, [bookings, services]);

  const visibleRooms = useMemo(() => roomFilter === "all" ? rooms : rooms.filter(r => r.id === roomFilter), [rooms, roomFilter]);
  const headerRangeLabel = useMemo(() => format(viewDays[0], "d 'de' MMMM yyyy", { locale: es }), [viewDays]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] p-5 font-sans relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* 🟢 ATMÓSFERA MEJORADA (Efecto "Vistoso") */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none z-0 animate-pulse" />
      
      <div className="relative z-10 max-w-[1800px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
             <div className="flex items-center gap-2 mb-2">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Gestión de Tiempo Real</p>
            </div>
             
             {/* ✅ LOGO ACTUALIZADO */}
             <Logo widthClass="w-[230px]" />
             
             <p className="text-sm text-zinc-500 mt-4 max-w-md hidden md:block leading-relaxed">
              Organiza tus sesiones, bloquea horarios y audita la producción mensual.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowMonthlyModal(true)}
                className="relative group bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-2xl overflow-hidden transition-all hover:border-emerald-500/50 hover:scale-105 active:scale-95 shadow-xl"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3">
                    <IconCalendarAudit className="text-emerald-400 group-hover:text-emerald-300 transition-colors" size={28} />
                    <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Auditoría</span>
                        <span className="text-xs font-bold text-white">Vista Mensual</span>
                    </div>
                </div>
            </button>

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 backdrop-blur-md shadow-lg">
                <button onClick={() => setViewStart(d => addDays(d, -1))} className="p-2 text-zinc-400 hover:text-white transition-all hover:bg-zinc-800 rounded-lg"> <IconArrowLeft size={18} /> </button>
                <div className="px-6 text-center border-x border-zinc-800/50"><span className="text-[9px] block text-zinc-600 font-bold mb-0.5 uppercase tracking-widest">Timeline</span><span className="text-sm font-bold text-white shadow-sm">{headerRangeLabel}</span></div>
                <button onClick={() => setViewStart(d => addDays(d, 1))} className="p-2 text-zinc-400 hover:text-white transition-all hover:bg-zinc-800 rounded-lg"> <IconArrowRight size={18} /> </button>
            </div>
            
            <button 
              onClick={() => setStartAt(new Date().toISOString().slice(0, 16))} 
              className="bg-emerald-500 text-black px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 hover:bg-emerald-400 hover:scale-105"
            >
              <IconPlus size={16} strokeWidth={3} /> Nueva Reserva
            </button>
          </div>
        </div>

        {/* --- 💡 BANNER DE INSTRUCCIONES (NUEVO) --- */}
        <div className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-zinc-800/30 to-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="bg-[#0c0c0e]/80 rounded-xl px-6 py-3 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-emerald-500/10 rounded text-emerald-400"><Info size={14} /></div>
                 <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Tips de Uso:</span>
              </div>
              <div className="flex items-center gap-2">
                 <Move size={14} className="text-zinc-500" />
                 <span><strong className="text-zinc-300">Arrastrar y Soltar</strong> para reagendar rápidamente.</span>
              </div>
              <div className="w-px h-4 bg-zinc-800 hidden md:block" />
              <div className="flex items-center gap-2">
                 <MousePointer2 size={14} className="text-zinc-500" />
                 <span><strong className="text-zinc-300">Clic</strong> en una reserva para ver detalles o editar.</span>
              </div>
              <div className="w-px h-4 bg-zinc-800 hidden md:block" />
              <div className="flex items-center gap-2">
                 <LayoutGrid size={14} className="text-zinc-500" />
                 <span>Usa la vista <strong className="text-zinc-300">Semanal (7 D)</strong> para ver el panorama completo.</span>
              </div>
           </div>
        </div>

        {/* --- BARRA DE HERRAMIENTAS VISTOSA --- */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-zinc-900/40 p-2 pl-4 pr-2 rounded-[24px] border border-zinc-800 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 bg-zinc-800/40 px-4 py-2 rounded-xl border border-zinc-700/30 hover:border-zinc-500/50 transition-colors">
            <GripHorizontal size={14} className="text-zinc-500" />
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sala:</span>
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-200 outline-none cursor-pointer hover:text-white transition-colors">
              <option value="all" className="bg-[#0c0c0e]">TODAS</option>
              {rooms.map(r => <option key={r.id} value={r.id} className="bg-[#0c0c0e]">{r.name.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-800/40 p-1 rounded-xl border border-zinc-700/30">
            {(['day', 'two', 'week'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${viewMode === mode ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'}`}>
                {mode === 'day' ? '1 D' : mode === 'two' ? '2 D' : '7 D'}
              </button>
            ))}
          </div>

          <div className="flex-1" />
          
          <button onClick={() => setShowStats(!showStats)} className={`p-3 rounded-xl border transition-all ${showStats ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-900/20' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500 hover:text-white hover:bg-zinc-700/50'}`}>
            <IconChart size={20} />
          </button>
          <button onClick={() => setShowClientModal(true)} className="p-3 bg-zinc-800/40 border border-zinc-700/30 text-zinc-500 hover:text-white rounded-xl transition-all hover:bg-zinc-700/50">
            <IconUser size={20} />
          </button>
          
          <button onClick={exportToExcel} className="px-5 py-3 bg-zinc-800/20 border border-zinc-700/20 text-zinc-500 text-[9px] font-black tracking-widest uppercase rounded-2xl hover:border-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">CSV</button>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px] backdrop-blur-md hover:border-emerald-500/30 transition-colors">
              <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Caja Real</p>
              <h4 className="text-3xl font-light text-emerald-400">${stats.collectedRevenue.toLocaleString('es-CL')}</h4>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px] backdrop-blur-md hover:border-zinc-600/30 transition-colors">
              <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Ocupación</p>
              <h4 className="text-3xl font-light text-white">{stats.totalHours} Hrs</h4>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[32px] backdrop-blur-md hover:border-zinc-600/30 transition-colors">
              <p className="text-[10px] uppercase text-zinc-600 font-black mb-1">Salud de Cobros</p>
              <h4 className="text-3xl font-light text-white">{stats.estimatedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.estimatedRevenue) * 100) : 0}%</h4>
            </div>
          </div>
        )}

        <QuickCreatePanel 
          roomId={roomId} setRoomId={setRoomId} serviceId={serviceId} setServiceId={setServiceId} staffId={staffId} setStaffId={setStaffId}
          startAt={startAt} setStartAt={setStartAt} clientName={clientName} handleClientNameChange={handleClientNameChange}
          notes={notes} setNotes={setNotes} color={color} setColor={setColor} rooms={rooms} services={services} staff={staff} 
          onCreate={createBooking} 
        />

        <CalendarGrid 
          viewDays={viewDays} hours={hours} START_HOUR={START_HOUR} visibleRooms={visibleRooms} bookingsIndex={bookingsIndex}
          clientMap={new Map(clients.map(c => [c.id, c]))} serviceMap={new Map(services.map(s => [s.id, s]))}
          onDragEnd={onDragEnd} onEdit={openEdit} onResize={() => {}} dayKey={dayKey}
        />

        {selectedBooking && (
          <SessionModal 
            booking={selectedBooking} clientMap={new Map(clients.map(c => [c.id, c]))} rooms={rooms} editRoomId={editRoomId} editColor={editColor}
            onClose={() => setSelectedBooking(null)} onDelete={deleteBooking} onSave={saveColor} onTogglePayment={togglePayment} 
            onStartSession={startSession} onStopSession={stopSession} setEditRoomId={setEditRoomId} setEditColor={setEditColor}
          />
        )}

        {showClientModal && (
          <ClientModal 
            onClose={() => setShowClientModal(false)} name={newClientName} setName={setNewClientName}
            phone={newClientPhone} setPhone={setNewClientPhone} onCreate={createClientOnly}
          />
        )}

        {showMonthlyModal && (
          <MonthlyViewModal 
            onClose={() => setShowMonthlyModal(false)}
            orgId={ORG_ID}
            rooms={rooms}
          />
        )}
      </div>
    </div>
  );
}