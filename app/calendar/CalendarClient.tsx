"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { supabase as sb } from "@/lib/supabaseClient";

/* ======================
   ✅ ORG FIJA
====================== */
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";

/* ======================
   TIPOS
====================== */
type Room = { id: string; name: string };
type Staff = { id: string; name: string; role: string; active: boolean };
type Service = { id: string; name: string; duration_minutes: number; price: number; active: boolean };

// Tabla bookings
type Booking = {
  id: string;
  org_id?: string;
  room_id: string;
  staff_id: string | null;
  service_id: string | null;
  client_id?: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email?: string | null;
  start_at: string;
  end_at: string;
  notes: string | null;
  color: string | null;

  // opcionales
  started_at?: string | null;
  ended_at?: string | null;
  payment_status?: "pending" | "paid" | string | null;
};

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

/* ======================
   CONFIG GRILLA
====================== */
const START_HOUR = 0;
const END_HOUR = 28;
const SLOT_MIN = 30; // snap cada 30 minutos

const PX_PER_HOUR = 60; // 60px = 1 hora
const HEADER_H = 56;

const GRID_BG_DARK = "#0b0f1a";
const GRID_BG_LIGHT = "#ffffff";

const GRID_LINE_DARK = "rgba(255,255,255,0.08)";
const GRID_LINE_LIGHT = "rgba(0,0,0,0.08)";

const CARD_BG_DARK = "rgba(255,255,255,0.04)";
const CARD_BG_LIGHT = "rgba(0,0,0,0.03)";

const CARD_BORDER_DARK = "rgba(255,255,255,0.08)";
const CARD_BORDER_LIGHT = "rgba(0,0,0,0.10)";

const TEXT_DARK = "rgba(255,255,255,0.92)";
const TEXT_LIGHT = "rgba(0,0,0,0.90)";

const MUTED_DARK = "rgba(255,255,255,0.6)";
const MUTED_LIGHT = "rgba(0,0,0,0.55)";

// helper: yyyy-MM-dd
function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function clampToBounds(date: Date) {
  const start = new Date(date);
  const min = new Date(date);
  min.setHours(START_HOUR, 0, 0, 0);

  const max = new Date(date);
  max.setHours(END_HOUR, 0, 0, 0);

  if (start < min) return min;
  if (start > max) return max;
  return start;
}

function snapMinutes(mins: number) {
  return Math.round(mins / SLOT_MIN) * SLOT_MIN;
}

function calcTopPx(date: Date) {
  const min = date.getHours() * 60 + date.getMinutes();
  const minFromStart = min - START_HOUR * 60;
  return (minFromStart / 60) * PX_PER_HOUR;
}

function calcHeightPx(start: Date, end: Date) {
  const mins = differenceInMinutes(end, start);
  return (mins / 60) * PX_PER_HOUR;
}

function humanDurationMinutes(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ======================
   DROPPABLE
====================== */
function DroppableCell({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        outline: isOver ? "2px solid rgba(34,197,94,0.65)" : "none",
        outlineOffset: -2,
      }}
    />
  );
}

/* ======================
   BOOKING CARD (DRAG + RESIZE)
====================== */
function DraggableBooking({
  booking,
  topPx,
  heightPx,
  label,
  subLabel,
  avatarUrl,
  isRunning,
  elapsedMin,
  paymentStatus,
  onDoubleClick,
  onResizeStart,
}: {
  booking: Booking;
  topPx: number;
  heightPx: number;
  label: string;
  subLabel: string;
  avatarUrl?: string | null;
  isRunning: boolean;
  elapsedMin: number | null;
  paymentStatus?: string | null;
  onDoubleClick: () => void;
  onResizeStart: (e: React.PointerEvent) => void; // Cambiado a PointerEvent
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
  });

  const baseBg = booking.color || "rgba(34,197,94,0.22)";
  const isPaid = paymentStatus === "paid";
  
  // Estilo visual mejorado
  const borderStyle = isPaid 
    ? "2px solid rgba(34, 197, 94, 0.9)" // Verde si pagado
    : "1px solid rgba(255,255,255,0.15)"; // Sutil si pendiente

  const style: CSSProperties = {
    position: "absolute",
    left: 4,
    right: 4,
    top: topPx,
    height: Math.max(heightPx, 30),
    borderRadius: 8,
    background: baseBg,
    border: borderStyle,
    boxShadow: isDragging ? "0 12px 30px rgba(0,0,0,0.35)" : "0 4px 10px rgba(0,0,0,0.15)",
    padding: "6px 8px",
    cursor: "grab", // Cursor de mano para mover
    userSelect: "none",
    backdropFilter: "blur(6px)",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : 10,
    overflow: "visible", // Importante para que el resize handle no se corte
    display: "flex", 
    flexDirection: "column",
    justifyContent: "center",
    transition: isDragging ? "none" : "top 0.1s, height 0.1s" // Suaviza cuando no estás arrastrando
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onDoubleClick={(e) => {
        e.stopPropagation(); // Evita conflictos con el grid
        onDoubleClick();
      }}
      {...attributes} 
      {...listeners}
    >
      {/* Contenido de la Tarjeta */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        <div style={{ width: 24, height: 24, borderRadius: 999, background: "rgba(255,255,255,0.25)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>👤</span>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.15, color: "rgba(255,255,255,0.98)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isPaid ? "✓ " : ""}{label}
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.2, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{subLabel}</div>
        </div>
      </div>

      {/* Progreso tiempo real */}
      {isRunning && elapsedMin != null ? (
        <div style={{ marginTop: 4, pointerEvents: "none" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.9)", fontWeight: 800, marginBottom: 2 }}>🔴 {Math.floor(elapsedMin/60)}h {elapsedMin%60}m</div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
             <div style={{ height: "100%", width: "100%", background: "#ef4444" }} />
          </div>
        </div>
      ) : null}

      {/* ✅ ÁREA DE RESIZE MEJORADA 
         Usa onPointerDown + stopPropagation para que NO se active el arrastre del padre
      */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation(); // <--- LA CLAVE: Detiene el arrastre de la tarjeta
          onResizeStart(e);
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 16, // Zona más alta para facilitar el clic
          cursor: "ns-resize", // Cursor de flecha doble obligatoria
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          paddingBottom: 4,
          zIndex: 20, // Asegura que esté por encima
          touchAction: "none" // Evita scroll en móviles al tocar aquí
        }}
        title="Arrastra para alargar/acortar"
      >
        {/* Indicador visual (la rayita blanca) */}
        <div style={{ width: 30, height: 4, background: "rgba(255,255,255,0.5)", borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function CalendarClient() {
  /* =========================================
     1. HOOKS DE ESTADO E INICIALIZACIÓN
     ========================================= */
  
  // Estado de montaje
  const [isMounted, setIsMounted] = useState(false);

  // Tema
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Al cargar (Solo cliente)
  useEffect(() => {
    setIsMounted(true);
    const t = window.localStorage.getItem("turnoaqui_theme");
    if (t === "light" || t === "dark") {
      setTheme(t);
    }
  }, []);

  // Al cambiar tema
  useEffect(() => {
    if (isMounted) {
      window.localStorage.setItem("turnoaqui_theme", theme);
    }
  }, [theme, isMounted]);

 // 🟢 VARIABLES DE ESTILO GEMINI PRO
const BG_DARK = "#09090b";
const ACCENT_EMERALD = "#10b981";
const CARD_BG = "rgba(18, 18, 20, 0.4)";
const BORDER_COLOR = "rgba(39, 39, 42, 0.5)";

  // Estados de datos (Deben estar SIEMPRE aquí, antes de cualquier return)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(false);

  // Vista
  const [viewMode, setViewMode] = useState<"day" | "two" | "week">("day");
  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(new Date()));
  const [roomFilter, setRoomFilter] = useState<string>("all"); // Nuevo filtro
  const [editRoomId, setEditRoomId] = useState(""); // Para cambiar sala en modal
  const viewDays = useMemo(() => {
    if (viewMode === "week") {
      const w = startOfWeek(viewStart, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(w, i));
    }
    const len = viewMode === "two" ? 2 : 1;
    return Array.from({ length: len }).map((_, i) => addDays(startOfDay(viewStart), i));
  }, [viewMode, viewStart]);

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  // Indexación
  const bookingsIndex = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const d0 = new Date(b.start_at);
      const key = `${b.room_id}|${dayKey(d0)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      map.set(k, arr);
    }
    return map;
  }, [bookings]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  // Reloj
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  // Formulario
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [color, setColor] = useState("#22c55e");

  // Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editColor, setEditColor] = useState("rgba(34,197,94,0.26)");
  const [showStats, setShowStats] = useState(false);
  // ✅ ESTADOS PARA MODAL DE CLIENTE RÁPIDO
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Resize Hooks
  const [isResizing, setIsResizing] = useState(false);
  const [resizeBookingId, setResizeBookingId] = useState<string | null>(null);
  const resizeStartYRef = useRef(0);
  const resizeOriginalEndRef = useRef<Date | null>(null);
  const resizePreviewEndRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [resizeVersion, setResizeVersion] = useState(0);

  /* =========================================
     2. LÓGICA Y FUNCIONES
     ========================================= */
   
 // ✅ DETECTOR DE CHOQUES
  const checkOverlap = (targetRoomId: string, start: Date, end: Date, ignoreId?: string) => {
    const collision = bookings.find((b) => {
      // 1. Si es la misma reserva que estamos moviendo, ignorarla
      if (ignoreId && b.id === ignoreId) return false;
      
      // 2. Si es otra sala, no importa
      if (b.room_id !== targetRoomId) return false;

      // 3. Verificar cruce de horarios
      const bStart = new Date(b.start_at);
      const bEnd = new Date(b.end_at);
      
      // (Nuevo Inicio < Viejo Final) Y (Nuevo Final > Viejo Inicio)
      return start < bEnd && end > bStart;
    });

    return collision;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);

    if (!sb) {
      alert("Supabase no inicializado (revisa env vars en Vercel)");
      setLoading(false);
      return;
    }

    const [roomsRes, staffRes, servicesRes] = await Promise.all([
      sb.from("rooms").select("id,name").eq("org_id", ORG_ID).order("created_at", { ascending: true }),
      sb
        .from("staff")
        .select("id,name,role,active")
        .eq("org_id", ORG_ID)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      sb
        .from("services")
        .select("id,name,duration_minutes,price,active")
        .eq("org_id", ORG_ID)
        .eq("active", true)
        .order("created_at", { ascending: true }),
    ]);

    if (roomsRes.error) console.error(roomsRes.error);
    if (staffRes.error) console.error(staffRes.error);
    if (servicesRes.error) console.error(servicesRes.error);

    setRooms((roomsRes.data as Room[]) || []);
    setStaff((staffRes.data as Staff[]) || []);
    setServices((servicesRes.data as Service[]) || []);

    const clientsRes = await sb.from("clients").select("id,name,email,phone,avatar_url").order("created_at", { ascending: false });
    if (!clientsRes.error) {
      setClients((clientsRes.data as Client[]) || []);
    }

    setLoading(false);
  }, []);

  const loadBookingsForRange = useCallback(async (start: Date, daysCount: number) => {
    if (!sb) return;

    const rangeStart = startOfDay(start);
    const rangeEnd = endOfDay(addDays(start, daysCount - 1));

    const { data, error } = await sb
      .from("bookings")
      .select()
      .eq("org_id", ORG_ID)
      .gte("start_at", rangeStart.toISOString())
      .lte("start_at", rangeEnd.toISOString())
      .order("start_at", { ascending: true });

    if (error) {
      console.error(error);
      setBookings([]);
      return;
    }

    setBookings((data as Booking[]) || []);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const start = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    void loadBookingsForRange(start, daysCount);
  }, [loadBookingsForRange, viewMode, viewStart]);

  const onPrev = () => {
    if (viewMode === "week") setViewStart((d) => subWeeks(d, 1));
    else if (viewMode === "two") setViewStart((d) => addDays(d, -2));
    else setViewStart((d) => addDays(d, -1));
  };

  const onNext = () => {
    if (viewMode === "week") setViewStart((d) => addWeeks(d, 1));
    else if (viewMode === "two") setViewStart((d) => addDays(d, 2));
    else setViewStart((d) => addDays(d, 1));
  };

  const onToday = () => setViewStart(startOfDay(new Date()));

  const createBooking = async () => {
    if (!sb) return alert("Supabase no inicializado");

    if (!roomId) return alert("Selecciona una sala.");
    if (!serviceId) return alert("Selecciona un servicio.");
    if (!clientName.trim()) return alert("Nombre cliente requerido.");
    if (!startAt) return alert("Selecciona inicio.");

    const service = serviceMap.get(serviceId);
    const duration = service?.duration_minutes ?? 60;

    const start = new Date(startAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // 🛑 BLOQUEO DE CREACIÓN
  if (checkOverlap(roomId, start, end)) {
     alert("¡CUIDADO! Ya existe una reserva en ese horario y sala.");
     return;
     }
    let finalClientId: string | null = clientId || null;
    if (!finalClientId && clients.length >= 0 && clientName.trim()) {
      const upsertRes = await sb
        .from("clients")
        .upsert(
          [
            {
              id: undefined,
              name: clientName.trim(),
              email: clientEmail.trim() || null,
              phone: clientPhone.trim() || null,
              avatar_url: null,
            },
          ],
          { onConflict: "name" }
        )
        .select("id")
        .maybeSingle();

      if (!upsertRes.error && upsertRes.data?.id) {
        finalClientId = upsertRes.data.id as string;
        const clientsRes = await sb.from("clients").select("id,name,email,phone,avatar_url").order("created_at", { ascending: false });
        if (!clientsRes.error) setClients((clientsRes.data as Client[]) || []);
      }
    }

    const { error } = await sb.from("bookings").insert([
      {
        org_id: ORG_ID,
        room_id: roomId,
        staff_id: staffId || null,
        service_id: serviceId,
        client_id: finalClientId,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        client_email: clientEmail.trim() || null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        notes: notes.trim() || null,
        color,
        payment_status: "pending",
      },
    ]);

    if (error) {
      alert("Error creando reserva: " + error.message);
      return;
    }

    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
    setStartAt("");
    setClientId("");

    const startRange = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    await loadBookingsForRange(startRange, daysCount);
  };

  const openEdit = (b: Booking) => {
    setSelectedBooking(b);
    setEditColor(b.color || "rgba(34,197,94,0.26)");
  };

 const saveColor = async () => {
    if (!selectedBooking || !sb) return;

    // Definimos a qué sala va a ir finalmente
    const finalRoomId = editRoomId || selectedBooking.room_id;

    // 🛑 BLOQUEO EN MODAL
    // Solo verificamos si realmente está intentando cambiar de sala
    if (finalRoomId !== selectedBooking.room_id) {
       const start = new Date(selectedBooking.start_at);
       const end = new Date(selectedBooking.end_at);

       if (checkOverlap(finalRoomId, start, end, selectedBooking.id)) {
          alert("⛔ No puedes mover a esa sala: Está ocupada a esa hora.");
          return;
       }
    }

    const { error } = await sb
      .from("bookings")
      .update({ 
         color: editColor, 
         room_id: editRoomId || selectedBooking.room_id 
      })
      .eq("id", selectedBooking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error guardando cambios: " + error.message);
      return;
    }

    setSelectedBooking(null);
    
    // ESTAS SON LAS LÍNEAS QUE FALTABAN UWU
    const startRange = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    await loadBookingsForRange(startRange, daysCount);
  };

  const togglePayment = async () => {
    if (!selectedBooking || !sb) return;

    const current = (selectedBooking.payment_status || "pending") as string;
    const next = current === "paid" ? "pending" : "paid";

    const { error } = await sb.from("bookings").update({ payment_status: next }).eq("id", selectedBooking.id).eq("org_id", ORG_ID);
    if (error) {
      alert("Error actualizando pago: " + error.message);
      return;
    }

    setSelectedBooking({ ...selectedBooking, payment_status: next as any });
    setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? ({ ...b, payment_status: next as any }) : b)));
  };

  const startSession = async () => {
    if (!selectedBooking || !sb) return;
    const now = new Date().toISOString();

    const { error } = await sb
      .from("bookings")
      .update({ started_at: now, ended_at: null })
      .eq("id", selectedBooking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error iniciando sesión: " + error.message);
      return;
    }

    const updated = { ...selectedBooking, started_at: now, ended_at: null };
    setSelectedBooking(updated);
    setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? ({ ...b, started_at: now, ended_at: null }) : b)));
  };

  const stopSession = async () => {
    if (!selectedBooking || !sb) return;
    const now = new Date().toISOString();

    const { error } = await sb
      .from("bookings")
      .update({ ended_at: now })
      .eq("id", selectedBooking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error finalizando sesión: " + error.message);
      return;
    }

    const updated = { ...selectedBooking, ended_at: now };
    setSelectedBooking(updated);
    setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? ({ ...b, ended_at: now }) : b)));
  };

  const deleteBooking = async () => {
    if (!sb) return;
    if (!selectedBooking) return;
    const ok = confirm("¿Eliminar reserva?");
    if (!ok) return;

    const { error } = await sb.from("bookings").delete().eq("id", selectedBooking.id).eq("org_id", ORG_ID);

    if (error) {
      alert("Error eliminando: " + error.message);
      return;
    }

    setSelectedBooking(null);
    const startRange = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    await loadBookingsForRange(startRange, daysCount);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (!sb) return;

    const { active, over, delta } = event;
    if (!over) return;

    const bookingId = String(active.id);
    const dropId = String(over.id);

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const [newRoomId, dayIndexStr] = dropId.split("|");
    const dayIndex = Number(dayIndexStr);

    const oldStart = new Date(booking.start_at);
    const oldEnd = new Date(booking.end_at);
    const durationMin = Math.max(SLOT_MIN, differenceInMinutes(oldEnd, oldStart));

    const targetDay = viewDays[dayIndex];
    if (!targetDay) return;

    const deltaMinutes = snapMinutes(delta.y);
    const movedStart = new Date(oldStart.getTime() + deltaMinutes * 60 * 1000);

    const newStart = new Date(targetDay);
    newStart.setHours(movedStart.getHours(), movedStart.getMinutes(), 0, 0);

    const clampedStart = clampToBounds(newStart);
    const newEnd = new Date(clampedStart.getTime() + durationMin * 60 * 1000);
    // 🛑 BLOQUEO DE ARRASTRE
    // Nota: Pasamos booking.id como 4to dato para que no choque consigo mismo
    if (checkOverlap(newRoomId, clampedStart, newEnd, booking.id)) {
       alert("⛔ No puedes soltarlo ahí: La sala está ocupada.");
       return;
    }
    const { error } = await sb
      .from("bookings")
      .update({ room_id: newRoomId, start_at: clampedStart.toISOString(), end_at: newEnd.toISOString() })
      .eq("id", booking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error moviendo reserva: " + error.message);
      return;
    }

    const startRange = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
    const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
    await loadBookingsForRange(startRange, daysCount);
  };

  const startResize = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeBookingId(booking.id);
    resizeStartYRef.current = e.clientY;
    resizeOriginalEndRef.current = new Date(booking.end_at);
    resizePreviewEndRef.current = booking.end_at;
    document.body.style.cursor = "ns-resize";
  };

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      if (!resizeBookingId || !resizeOriginalEndRef.current) return;
      const booking = bookings.find((b) => b.id === resizeBookingId);
      if (!booking) return;

      const deltaY = e.clientY - resizeStartYRef.current;
      const deltaMinutes = snapMinutes(deltaY);

      const start = new Date(booking.start_at);
      const oldEnd = resizeOriginalEndRef.current;
      const newEnd = new Date(oldEnd.getTime() + deltaMinutes * 60 * 1000);

      const minEnd = new Date(start.getTime() + SLOT_MIN * 60 * 1000);
      const clamped = newEnd < minEnd ? minEnd : newEnd;

      resizePreviewEndRef.current = clamped.toISOString();

      if (rafIdRef.current != null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        setResizeVersion((v) => v + 1);
      });
    };

    const onUp = async () => {
      if (!sb) return;

      setIsResizing(false);
      document.body.style.cursor = "default";

      const booking = bookings.find((b) => b.id === resizeBookingId);
      const previewEnd = resizePreviewEndRef.current;

      setResizeBookingId(null);
      resizeOriginalEndRef.current = null;

      if (!booking || !previewEnd) return;
      if (previewEnd === booking.end_at) return;
      // 🛑 BLOQUEO DE RESIZE
      // Convertimos las fechas porque checkOverlap espera objetos Date
      if (checkOverlap(booking.room_id, new Date(booking.start_at), new Date(previewEnd), booking.id)) {
        alert("⛔ No puedes estirar tanto: Choca con otra reserva.");
        setResizeVersion(v => v + 1); // Esto obliga a que el dibujo vuelva a su sitio
        return;
      }

      const { error } = await sb.from("bookings").update({ end_at: previewEnd }).eq("id", booking.id).eq("org_id", ORG_ID);
      if (error) {
        alert("Error ajustando: " + error.message);
        return;
      }

      const startRange = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
      const daysCount = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
      await loadBookingsForRange(startRange, daysCount);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isResizing, resizeBookingId, bookings, loadBookingsForRange, viewMode, viewStart]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const gridHeightPx = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  const stats = useMemo(() => {
    const today = new Date();
    // Filtramos las de hoy
    const todayBookings = bookings.filter((b) => isSameDay(new Date(b.start_at), today)).length;
    const totalCount = bookings.length;
    
    let estimatedRevenue = 0; // Lo que deberías cobrar
    let collectedRevenue = 0; // Lo que ya entró a caja
    let totalMinutes = 0;     // Tiempo total de ocupación

    for (const b of bookings) {
      // 1. Dinero: Buscamos el precio en el mapa de servicios
      const s = b.service_id ? serviceMap.get(b.service_id) : null;
      const price = s?.price || 0;
      estimatedRevenue += price;
      
      if (b.payment_status === "paid") {
        collectedRevenue += price;
      }

      // 2. Tiempo: Calculamos la duración real de cada bloque
      const duration = differenceInMinutes(new Date(b.end_at), new Date(b.start_at));
      totalMinutes += duration;
    }

    // Estudio más solicitado
    const roomCount = new Map<string, number>();
    for (const b of bookings) roomCount.set(b.room_id, (roomCount.get(b.room_id) || 0) + 1);
    const most = Array.from(roomCount.entries()).sort((a, b) => b[1] - a[1])[0];
    const mostRoom = most ? rooms.find((r) => r.id === most[0])?.name || "—" : "—";
    
    return { 
      todayBookings, 
      totalCount, 
      mostRoom, 
      estimatedRevenue, 
      collectedRevenue,
      totalHours: (totalMinutes / 60).toFixed(1)
    };
  }, [bookings, rooms, serviceMap]);

  // 1. Filtrar salas visibles (Nuevo)
const visibleRooms = useMemo(() => {
  if (roomFilter === "all") return rooms;
  return rooms.filter(r => r.id === roomFilter);
}, [rooms, roomFilter]);

// 2. Etiqueta de fecha en ESPAÑOL (Reemplazo mejorado)
const headerRangeLabel = useMemo(() => {
  if (viewDays.length === 1) return format(viewDays[0], "d 'de' MMMM yyyy", { locale: es });
  const d1 = viewDays[0];
  const d2 = viewDays[viewDays.length - 1];
  return `${format(d1, "d MMM", { locale: es })} - ${format(d2, "d MMM yyyy", { locale: es })}`;
}, [viewDays]);

  const onSelectClient = (id: string) => {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setClientName(c.name || "");
    setClientEmail(c.email || "");
    setClientPhone(c.phone || "");
  };

  // 📥 FUNCIÓN PARA EXPORTAR A EXCEL (CSV)
  const exportToExcel = () => {
    // 1. Cabeceras de las columnas (Títulos de Excel)
    const headers = ["Cliente", "Servicio", "Sala", "Fecha", "Inicio", "Fin", "Precio", "Estado Pago"];
    
    // 2. Transformar las reservas actuales en filas
    const rows = bookings.map(b => {
      const service = b.service_id ? serviceMap.get(b.service_id) : null;
      const room = rooms.find(r => r.id === b.room_id);
      const startDate = new Date(b.start_at);
      const endDate = new Date(b.end_at);
      
      return [
        b.client_name || "Sin nombre",
        service?.name || "Sesión",
        room?.name || "Sin sala",
        format(startDate, "dd/MM/yyyy"),
        format(startDate, "HH:mm"),
        format(endDate, "HH:mm"),
        service?.price || 0,
        b.payment_status === "paid" ? "Pagado" : "Pendiente"
      ];
    });

    // 3. Crear el contenido (Usamos ";" para que Excel en español lo separe bien)
    const csvContent = [headers, ...rows]
      .map(e => e.join(";"))
      .join("\n");

    // 4. Descarga automática con soporte para acentos (BOM)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Estudio_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función inteligente para buscar cliente mientras escribes
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    
    // Busca si el nombre coincide exactamente con uno guardado (sin importar mayúsculas)
    const found = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
    
    if (found) {
       // ¡Encontrado! Rellenamos todo
       setClientId(found.id);
       setClientPhone(found.phone || "");
       setClientEmail(found.email || "");
    } else {
       // No coincide, así que es un cliente nuevo (limpiamos el ID para que cree uno nuevo)
       setClientId(""); 
       // Opcional: No borramos teléfono/email para no molestar si solo estás corrigiendo el nombre
    }
  };

  // ✅ FUNCIÓN: CREAR CLIENTE SOLO (SIN RESERVA)
  const createClientOnly = async () => {
    if (!sb) return;
    if (!newClientName.trim()) return alert("El nombre es obligatorio.");

    const { data, error } = await sb
      .from("clients")
      .insert([{
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
        email: newClientEmail.trim() || null
      }])
      .select()
      .single();

    if (error) {
      alert("Error al crear cliente: " + error.message);
      return;
    }

    // Actualizar lista local y limpiar
    setClients((prev) => [data as Client, ...prev]);
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setShowClientModal(false);
    alert("Cliente guardado correctamente.");
  };

  /* =========================================
     ✅ AQUÍ VA EL BLOQUEO (Al final de la lógica)
     ========================================= */
  if (!isMounted) {
    return null;
  }

  /* =========================================
     3. RENDER (HTML)
     ========================================= */
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] p-5 font-sans relative overflow-hidden">
      {/* AURA ESMERALDA DE FONDO */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* --- CABECERA --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-light tracking-tighter text-white">
              Turno<span className="text-emerald-500 font-bold italic">Aquí</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black mt-1">Control de Sesiones Pro</p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
            <button onClick={onPrev} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> ← </button>
            <div className="px-4 py-1 text-center min-w-[150px]">
              <span className="text-[10px] block uppercase tracking-widest text-zinc-600 font-bold">Agenda</span>
              <span className="text-sm font-medium text-zinc-200">{headerRangeLabel}</span>
            </div>
            <button onClick={onNext} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"> → </button>
          </div>

          <div className="flex gap-3">
            <button onClick={onToday} className="px-4 py-2 rounded-xl bg-zinc-800/40 text-zinc-500 border border-zinc-700/30 hover:text-white transition-all text-[10px] font-bold tracking-widest uppercase">Hoy</button>
            <button 
              onClick={() => { setEditingBooking(null); setShowModal(true); }}
              className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
            >
              + NUEVA RESERVA
            </button>
          </div>
        </div>

        {/* --- BARRA DE HERRAMIENTAS --- */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-zinc-900/30 p-3 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-zinc-800/40 px-4 py-2 rounded-xl border border-zinc-700/30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recurso:</span>
            <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="bg-transparent border-none text-xs font-bold text-zinc-200 outline-none">
              <option value="all" className="bg-zinc-900">TODOS LOS ESTUDIOS</option>
              {rooms.map(r => <option key={r.id} value={r.id} className="bg-zinc-900">{r.name.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-zinc-800/40 p-1 rounded-xl border border-zinc-700/30">
            {(['day', 'two', 'week'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${viewMode === mode ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {mode === 'day' ? '1 DÍA' : mode === 'two' ? '2 DÍAS' : 'SEMANA'}
              </button>
            ))}
          </div>

          <div className="flex-1" />
          <button onClick={() => setShowStats(!showStats)} className={`p-2.5 rounded-xl border transition-all ${showStats ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500 hover:text-white'}`}>📊</button>
          <button onClick={() => setShowClientModal(true)} className="p-2.5 bg-zinc-800/40 border border-zinc-700/30 text-zinc-500 hover:text-white rounded-xl">👤</button>
          <button onClick={exportToExcel} className="px-4 py-2.5 bg-zinc-800/40 border border-zinc-700/30 text-zinc-500 text-[9px] font-black tracking-widest uppercase rounded-xl">Exportar</button>
        </div>

        {/* --- GRID DEL CALENDARIO --- */}
        <DndContext onDragEnd={onDragEnd}>
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl relative">
            <div className="overflow-auto max-h-[75vh] custom-scrollbar">
              <div className="grid relative" style={{ gridTemplateColumns: `100px repeat(${viewDays.length}, minmax(200px, 1fr))`, width: '100%' }}>
                
                {/* Timeline Lateral */}
                <div className="sticky left-0 z-40 bg-[#09090b] border-r border-zinc-800/60">
                  <div className="h-16 border-b border-zinc-800/50 flex items-center justify-center bg-[#0c0c0e]">
                    <span className="text-[9px] font-black text-zinc-700 tracking-[0.3em] uppercase">Time</span>
                  </div>
                  {hours.map((h) => (
                    <div key={h} className="h-[120px] border-b border-zinc-800/10 flex items-start justify-center pt-3">
                      <span className="text-[10px] font-mono font-bold text-zinc-600">{String(h >= 24 ? h - 24 : h).padStart(2, "0")}:00</span>
                    </div>
                  ))}
                </div>

                {/* Días */}
                {viewDays.map((day, dayIdx) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toISOString()} className={`relative border-r border-zinc-800/20 ${isToday ? 'bg-emerald-500/5' : ''}`}>
                      <div className="sticky top-0 z-30 h-16 border-b border-zinc-800/50 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-md">
                        <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>{format(day, "EEEE", { locale: es })}</span>
                        <span className={`text-xl font-light ${isToday ? 'text-white' : 'text-zinc-300'}`}>{format(day, "dd")}</span>
                      </div>

                      <div className="relative" style={{ height: hours.length * 120 }}>
                        {rooms.map((room) => (
                          <div key={room.id} className="absolute inset-0">
                            <DroppableCell id={`${room.id}|${dayIdx}`} />
                            {(bookingsIndex.get(`${room.id}|${dayKey(day)}`) || []).map((b) => (
                              <DraggableBooking
                                key={b.id}
                                booking={b}
                                topPx={(new Date(b.start_at).getHours() - 8) * 120 + (new Date(b.start_at).getMinutes() * 2)}
                                heightPx={differenceInMinutes(new Date(b.end_at), new Date(b.start_at)) * 2}
                                label={b.client_name || "CLIENTE"}
                                onDoubleClick={() => setSelectedBooking(b)}
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
      </div>

      {/* --- MODALES --- */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl text-white font-light">Ficha de <span className="text-emerald-500 italic">Sesión</span></h2>
            <p className="text-zinc-500 mb-8 uppercase text-[10px] tracking-widest font-bold">{selectedBooking.client_name}</p>
            <div className="flex gap-4">
              <button onClick={() => { deleteBooking(selectedBooking.id); setSelectedBooking(null); }} className="p-4 bg-red-500/10 text-red-500 rounded-2xl flex-1 text-[10px] font-black tracking-widest hover:bg-red-500/20 transition-all">ELIMINAR</button>
              <button onClick={() => setSelectedBooking(null)} className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl flex-1 text-[10px] font-black tracking-widest hover:text-white transition-all">CERRAR</button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl">
            <h3 className="text-white text-lg font-light mb-6">Nuevo <span className="text-emerald-500">Cliente</span></h3>
            <div className="flex flex-col gap-4">
              <input placeholder="Nombre Completo" className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl text-white outline-none" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
              <input placeholder="WhatsApp" className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl text-white outline-none" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
              <button onClick={() => void createClientOnly()} className="bg-white text-black p-4 rounded-2xl font-black tracking-widest mt-2 hover:bg-emerald-400 transition-all">GUARDAR CLIENTE</button>
              <button onClick={() => setShowClientModal(false)} className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}