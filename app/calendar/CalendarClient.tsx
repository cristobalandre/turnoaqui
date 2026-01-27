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

  // Variables de estilo (se calcularán pero no se mostrarán si no está montado)
  const GRID_BG = theme === "dark" ? GRID_BG_DARK : GRID_BG_LIGHT;
  const GRID_LINE = theme === "dark" ? GRID_LINE_DARK : GRID_LINE_LIGHT;
  const CARD_BG = theme === "dark" ? CARD_BG_DARK : CARD_BG_LIGHT;
  const CARD_BORDER = theme === "dark" ? CARD_BORDER_DARK : CARD_BORDER_LIGHT;
  const TEXT = theme === "dark" ? TEXT_DARK : TEXT_LIGHT;
  const MUTED = theme === "dark" ? MUTED_DARK : MUTED_LIGHT;

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
    <div
      style={{
        minHeight: "100vh",
        background:
          theme === "dark"
            ? `radial-gradient(1000px 700px at 30% 20%, rgba(34,197,94,0.18), transparent 60%),
               radial-gradient(900px 600px at 70% 60%, rgba(168,85,247,0.16), transparent 55%),
               ${GRID_BG}`
            : GRID_BG,
        color: TEXT,
        padding: 18,
      }}
    >

    {/* 🎨 ESTILO SCROLLBAR (GEMINI STYLE) - Colocado en zona segura */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Barra completa (el carril) */
        ::-webkit-scrollbar {
          width: 10px; /* Más fina y elegante */
          height: 10px;
        }
        
        /* Fondo del carril (Invisible) */
        ::-webkit-scrollbar-track {
          background: transparent; 
        }
        
        /* El "dedo" o barra que se mueve */
        ::-webkit-scrollbar-thumb {
          background-color: rgba(120, 120, 120, 0.2); /* Muy sutil */
          border-radius: 10px;       /* Redondeado total */
        }

        /* Al pasar el mouse se oscurece un poco */
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(120, 120, 120, 0.5); 
        }
      `}} />

      {/* Header */}
      <div
        style={{
          height: HEADER_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 18,
          padding: "0 14px",
          border: `1px solid ${CARD_BORDER}`,
          background: CARD_BG,
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.14)",
          marginBottom: 16,
        }}
      >

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>Calendario</div>
          <div style={{ fontSize: 12, color: MUTED }}>{headerRangeLabel}</div>

          {loading ? <div style={{ marginLeft: 10, fontSize: 12, color: MUTED }}>Cargando...</div> : null}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        
          <select 
            value={roomFilter} 
            onChange={(e) => setRoomFilter(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 10, 
              border: `1px solid ${CARD_BORDER}`, background: "rgba(0,0,0,0.15)", 
              color: TEXT, fontSize: 13, cursor: "pointer", fontWeight: 600
            }}
          >
            <option value="all" style={{ color: "black" }}>🏢 Todos los Estudios</option>
            {rooms.map(r => <option key={r.id} value={r.id} style={{ color: "black" }}>
                 {r.name}
               </option>
            )}
          </select>

          {/* Divisor (Solo uno) */}
          <div style={{ width: 1, height: 20, background: CARD_BORDER, margin: "0 4px" }} />

          {/* Botón Estadísticas (Solo uno) */}
          <button
            onClick={() => setShowStats((s) => !s)}
            style={{
              padding: "8px 10px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Estadísticas"
          >
            📊
          </button>

          {/* ✅ BOTÓN NUEVO CLIENTE */}
          <button
            onClick={() => setShowClientModal(true)}
            style={{
              padding: "8px 10px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
              marginLeft: 4
            }}
            title="Nuevo Cliente Rápido"
          >
            👤+
          </button>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            style={{
              padding: "8px 10px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Vista"
          >
            <option value="day" style={{ color: "black" }}>1 día</option>
            <option value="two" style={{ color: "black" }}>2 días</option>
            <option value="week" style={{ color: "black" }}>Semana</option>
          </select>

          <button
            onClick={onPrev}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
            }}
          >
            ◀
          </button>

          <button
            onClick={onToday}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Hoy
          </button>

          <button
            onClick={onNext}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
            }}
          >
            ▶
          </button>

          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            style={{
              marginLeft: 4,
              padding: "8px 10px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Fondo blanco / azul"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {showStats ? (
        <div style={{ marginBottom: 20 }}>
          {/* Título y Botón de Exportar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
             <div style={{ fontSize: 14, fontWeight: 900, color: TEXT }}>📊 Resumen de Rendimiento</div>
             <button 
               onClick={exportToExcel}
               style={{
                 padding: "8px 16px", borderRadius: 12, background: "#22c55e", 
                 color: "white", border: "none", cursor: "pointer", fontWeight: "900", 
                 fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                 boxShadow: "0 4px 12px rgba(34,197,94,0.3)"
               }}
             >
               📥 Exportar a Excel
             </button>
          </div>

          {/* 1. TARJETAS DE ESTADÍSTICAS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Tarjeta: Dinero */}
            <div style={{ borderRadius: 18, border: `1px solid ${CARD_BORDER}`, padding: 16, background: "linear-gradient(135deg, rgba(34,197,94,0.15), transparent)", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 800 }}>💵 INGRESOS COBRADOS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#22c55e", margin: "4px 0" }}>
                ${stats.collectedRevenue.toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: 10, color: MUTED }}>Proyectado: ${stats.estimatedRevenue.toLocaleString('es-CL')}</div>
            </div>

            {/* Tarjeta: Horas */}
            <div style={{ borderRadius: 18, border: `1px solid ${CARD_BORDER}`, padding: 16, background: CARD_BG }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 800 }}>🎙️ HORAS DE USO</div>
              <div style={{ fontSize: 24, fontWeight: 900, margin: "4px 0" }}>{stats.totalHours}h</div>
              <div style={{ fontSize: 10, color: MUTED }}>En {stats.totalCount} sesiones</div>
            </div>

            {/* Tarjeta: Salud de Pagos */}
            <div style={{ borderRadius: 18, border: `1px solid ${CARD_BORDER}`, padding: 16, background: CARD_BG }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 800 }}>📉 SALUD DE PAGOS</div>
              <div style={{ fontSize: 24, fontWeight: 900, margin: "4px 0" }}>
                {stats.estimatedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.estimatedRevenue) * 100) : 0}%
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                 <div style={{ height: "100%", width: `${(stats.collectedRevenue / stats.estimatedRevenue) * 100}%`, background: "#3b82f6" }} />
              </div>
            </div>
          </div>

          {/* 2. LISTA DE PAGOS PENDIENTES */}
          <div style={{ borderRadius: 18, border: `1px solid ${CARD_BORDER}`, background: CARD_BG, padding: 16, backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 12 }}>⚠️ Pagos Pendientes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bookings.filter(b => b.payment_status !== "paid").length === 0 ? (
                <div style={{ fontSize: 11, color: MUTED, textAlign: "center" }}>✅ Todo al día.</div>
              ) : (
                bookings
                  .filter(b => b.payment_status !== "paid")
                  .map(b => {
                    const s = b.service_id ? serviceMap.get(b.service_id) : null;
                    return (
                      <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${CARD_BORDER}` }}>
                        <div style={{ fontSize: 12 }}><b>{b.client_name}</b> <br/> <span style={{fontSize: 10, color: MUTED}}>{s?.name}</span></div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "#fbbf24" }}>${(s?.price || 0).toLocaleString('es-CL')}</div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      ) : null}

     {/* Formulario Crear Reserva */}
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${CARD_BORDER}`,
          background: CARD_BG,
          backdropFilter: "blur(14px)",
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900 }}>Crear reserva</div>
          <div style={{ fontSize: 12, color: MUTED }}>Tip: arrastra el bloque para cambiar hora/día/sala</div>
        </div>

        {/* Fila 1: Sala, Servicio, Staff, Fecha */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          {/* Sala */}
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
            }}
          >
            <option value="" style={{ color: "black" }}>Sala / Recurso</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id} style={{ color: "black" }}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Servicio */}
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
            }}
          >
            <option value="" style={{ color: "black" }}>Servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id} style={{ color: "black" }}>
                {s.name} · {s.duration_minutes}m
              </option>
            ))}
          </select>

          {/* Staff */}
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
            }}
          >
            <option value="" style={{ color: "black" }}>Staff (opcional)</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id} style={{ color: "black" }}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Fecha */}
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
            }}
          />
        </div>

        {/* Fila 2: Nombre (con buscador inteligente), Teléfono, Email */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 10 }}>
      
      {/* 1. CAMPO FUSIONADO: NOMBRE + BUSCADOR */}
      <div style={{ position: "relative" }}>
        <input
          list="client-suggestions" 
          placeholder="Nombre del cliente (o buscar...)"
          value={clientName}
          onChange={(e) => handleClientNameChange(e.target.value)} // 👈 Usa la nueva función
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 14,
            border: `1px solid ${CARD_BORDER}`,
            background: "rgba(0,0,0,0.0)",
            color: TEXT,
            fontWeight: clientId ? "bold" : "normal" // Negrita si ya lo encontró
          }}
        />
        
        {/* Icono de confirmación si es un cliente registrado */}
        {clientId && (
           <div style={{ position: "absolute", right: 12, top: 12, fontSize: 14, pointerEvents: "none" }} title="Cliente registrado">
             ✅
           </div>
        )}
        
        {/* Lista invisible de sugerencias */}
        <datalist id="client-suggestions">
          {clients.map(c => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>

      {/* 2. CAMPO TELÉFONO (Igual que antes) */}
      <input
        placeholder="WhatsApp / Teléfono"
        value={clientPhone}
        onChange={(e) => setClientPhone(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 14,
          border: `1px solid ${CARD_BORDER}`,
          background: "rgba(0,0,0,0.0)",
          color: TEXT,
        }}
      />

      {/* 3. CAMPO EMAIL (Igual que antes) */}
      <input
        placeholder="Correo (opcional)"
        value={clientEmail}
        onChange={(e) => setClientEmail(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 14,
          border: `1px solid ${CARD_BORDER}`,
          background: "rgba(0,0,0,0.0)",
          color: TEXT,
        }}
      />
    </div>

        {/* Fila 3: Notas, Color, Botón Crear */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <input
            placeholder="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.0)",
              color: TEXT,
            }}
          />

         {/* Selector de Color Circular Funcional */}
          {/* Selector de Color - Círculo Perfecto */}
          <div style={{ position: "relative", width: 44, height: 44 }}>
            
            {/* 1. La "Máscara" Visual (El círculo bonito) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: color, // Aquí se muestra el color elegido
                border: `2px solid ${CARD_BORDER}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "background 0.2s"
              }}
            />

            {/* 2. El Input "Invisible" (Detecta el clic) */}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="Toca para cambiar el color"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0, // 👈 Esto lo hace invisible, pero sigue funcionando
                cursor: "pointer",
                padding: 0,
                border: "none"
              }}
            />
          </div>

          <button
            onClick={() => void createBooking()}
            style={{
              gridColumn: "span 2",
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(34,197,94,0.22)",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ➕ Crear reserva
          </button>
        </div>
      </div>

      {/* Drag context global */}
      <DndContext onDragEnd={onDragEnd}>
        {/* Grid Unificado: Cabecera Sticky + Cuerpo Scrollable */}
        {/* Al estar juntos, comparten el ancho exacto y se alinean perfecto */}
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${CARD_BORDER}`,
            background: CARD_BG,
            backdropFilter: "blur(14px)",
            height: "75vh",         // Altura fija
            overflowY: "scroll",      // ✅ El scroll está aquí, en el padre de todos
            overflowX: "hidden",
            position: "relative",
            display: "block"
          }}
        >
          {/* 1. CABECERA PEGAJOSA (Sticky Header) */}
          <div
            style={{
              position: "sticky",   // 👈 La clave: se pega arriba al hacer scroll
              top: 0,
              zIndex: 40,           // Por encima de las reservas normales (z=10)
              display: "grid",
              gridTemplateColumns: `140px repeat(${viewDays.length}, 1fr)`,
              borderBottom: `1px solid ${GRID_LINE}`,
              background: theme === "dark" ? "#0b0f1a" : "#ffffff", // Fondo sólido para que no se trasluzca
              paddingRight: "10px", 
            }}
          >
            <div style={{ padding: 12, borderRight: `1px solid ${GRID_LINE}`, color: MUTED, fontSize: 12 }}>
              Horas
            </div>
            {viewDays.map((d) => (
              <div key={d.toISOString()} style={{ padding: 12, borderRight: `1px solid ${GRID_LINE}`, fontWeight: 900 }}>
                {format(d, "EEEE d", { locale: es })}
              </div>
            ))}
          </div>

          {/* 2. CUERPO DEL CALENDARIO */}
          <div style={{ position: "relative" }}>
             <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${viewDays.length}, 1fr)` }}>
              
              {/* Columna Izquierda - HORAS */}
              <div style={{ position: "relative", height: gridHeightPx, borderRight: `1px solid ${GRID_LINE}` }}>
                {hours.map((h) => {
                  const top = (h - START_HOUR) * PX_PER_HOUR;
                  const displayHour = h >= 24 ? h - 24 : h;
                  return (
                    <div key={h} style={{ position: "absolute", top, left: 0, right: 0, borderTop: `1px solid ${GRID_LINE}` }}>
                      <div style={{ position: "absolute", top: -8, left: 10, fontSize: 11, color: MUTED }}>
                        {String(displayHour).padStart(2, "0")}:00
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Columnas de DÍAS y SALAS */}
              {viewDays.map((day, dayIdx) => {
                return (
                  <div key={day.toISOString()} style={{ position: "relative", borderRight: `1px solid ${GRID_LINE}` }}>
                    {visibleRooms.map((room) => {
                      const cellId = `${room.id}|${dayIdx}`;
                      const dayBookings = bookingsIndex.get(`${room.id}|${dayKey(day)}`) || [];

                      return (
                        <div
                          key={room.id}
                          style={{
                            position: "relative",
                            height: gridHeightPx,
                            background:
                              theme === "dark"
                                ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
                                : "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))",
                          }}
                        >
                          {/* Nombre de sala (Repetido) */}
                          <div
                            style={{
                              position: "absolute", top: 8, left: 10, fontSize: 11,
                              color: MUTED, fontWeight: 900, pointerEvents: "none", zIndex: 5
                            }}
                          >
                            {room.name}
                          </div>

                          <DroppableCell id={cellId} />

                          {/* Líneas guía */}
                          {hours.map((h) => {
                            const top = (h - START_HOUR) * PX_PER_HOUR;
                            return (
                              <div
                                key={h}
                                style={{
                                  position: "absolute", left: 0, right: 0, top,
                                  borderTop: `1px solid ${GRID_LINE}`, opacity: 0.6, pointerEvents: "none"
                                }}
                              />
                            );
                          })}

                          {/* RESERVAS */}
                          {dayBookings.map((b) => {
                            const start = new Date(b.start_at);
                            const end = resizeBookingId === b.id && resizePreviewEndRef.current ? new Date(resizePreviewEndRef.current) : new Date(b.end_at);
                            const topPx = calcTopPx(start);
                            const heightPx = calcHeightPx(start, end);
                            const serviceName = b.service_id ? serviceMap.get(b.service_id)?.name || "Servicio" : "Sesión";
                            const durationMin = Math.max(0, differenceInMinutes(end, start));
                            const client = b.client_id ? clientMap.get(b.client_id) : undefined;
                            const avatarUrl = client?.avatar_url || null;
                            const startedAt = b.started_at ? new Date(b.started_at) : null;
                            const endedAt = b.ended_at ? new Date(b.ended_at) : null;
                            const isRunning = Boolean(startedAt) && !endedAt;
                            const elapsedMin = startedAt ? Math.max(0, differenceInMinutes(endedAt ?? new Date(nowTick), startedAt)) : null;
                            const label = b.client_name || "Cliente";
                            const subLabel = `${serviceName} · ${humanDurationMinutes(durationMin)}`;

                            return (
                              <DraggableBooking
                                paymentStatus={b.payment_status}
                                key={b.id}
                                booking={b}
                                topPx={topPx}
                                heightPx={heightPx}
                                label={label}
                                subLabel={subLabel}
                                avatarUrl={avatarUrl}
                                isRunning={isRunning}
                                elapsedMin={elapsedMin}
                                onDoubleClick={() => openEdit(b)}
                                onResizeStart={(e) => startResize(b, e)}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>

      {/* Modal - Versión Final Limpia y Completa */}
      {selectedBooking ? (
        <div
          onClick={() => setSelectedBooking(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 96vw)",
              borderRadius: 18,
              border: `1px solid ${CARD_BORDER}`,
              background: theme === "dark" ? "rgba(10,15,26,0.95)" : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(14px)",
              padding: 16,
              color: TEXT,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header del Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Ficha de sesión</div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 12,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "transparent",
                  color: TEXT,
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            {/* Info Básica */}
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, padding: "0 4px" }}>
              <div style={{marginBottom: 4}}><b>Cliente:</b> <span style={{color: TEXT}}>{selectedBooking.client_name || "—"}</span></div>
              <div style={{marginBottom: 4}}><b>Contacto:</b> {selectedBooking.client_phone || "—"} / {selectedBooking.client_email || "—"}</div>
              <div style={{ marginTop: 8 }}>
                <b>Horario:</b> {format(new Date(selectedBooking.start_at), "EEEE d 'de' MMMM", { locale: es })} <br/>
                de {format(new Date(selectedBooking.start_at), "HH:mm")} a {format(new Date(selectedBooking.end_at), "HH:mm")}
              </div>
            </div>

            {/* SECCIÓN DE ACCIONES (Sala, Color, Pago) */}
            <div style={{ padding: 12, background: "rgba(0,0,0,0.03)", borderRadius: 14, border: `1px solid ${CARD_BORDER}` }}>
               
               {/* Fila 1: Color y Guardar */}
               <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    style={{ width: 40, height: 34, borderRadius: 8, border: "none", cursor: "pointer", padding: 0, background: "none" }}
                    title="Elegir color"
                  />
                  <div style={{fontSize: 12, color: MUTED, flex: 1}}>Color de etiqueta</div>
                  <button
                    onClick={() => void saveColor()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: "#3b82f6",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    Guardar Cambios
                  </button>
               </div>

               {/* Fila 2: Sala */}
               <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4, fontWeight: 700 }}>MOVER A SALA:</label>
                  <select
                    value={editRoomId || selectedBooking.room_id} 
                    onChange={(e) => setEditRoomId(e.target.value)} 
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: CARD_BG, color: TEXT, border: `1px solid ${CARD_BORDER}`, outline: "none" }}
                  >
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
               </div>

               {/* Fila 3: Botones Grandes (Pago y Sesión) */}
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => {
                       const next = selectedBooking.payment_status === "paid" ? "pending" : "paid";
                       setSelectedBooking({...selectedBooking, payment_status: next});
                       sb.from("bookings").update({ payment_status: next }).eq("id", selectedBooking.id).then(() => {
                          const start = viewMode === "week" ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
                          const count = viewMode === "week" ? 7 : viewMode === "two" ? 2 : 1;
                          loadBookingsForRange(start, count);
                       });
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: 10,
                      border: `1px solid ${CARD_BORDER}`,
                      background: selectedBooking.payment_status === "paid" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.15)",
                      color: selectedBooking.payment_status === "paid" ? "#22c55e" : "#fbbf24",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    {selectedBooking.payment_status === "paid" ? "✅ PAGADO" : "⏳ PENDIENTE"}
                  </button>

                  {selectedBooking.started_at && !selectedBooking.ended_at ? (
                    <button
                      onClick={() => void stopSession()}
                      style={{
                        padding: "10px",
                        borderRadius: 10,
                        border: `1px solid ${CARD_BORDER}`,
                        background: "rgba(239,68,68,0.15)",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 12
                      }}
                    >
                      ⏹ Finalizar
                    </button>
                  ) : (
                    <button
                      onClick={() => void startSession()}
                      style={{
                        padding: "10px",
                        borderRadius: 10,
                        border: `1px solid ${CARD_BORDER}`,
                        background: "rgba(59,130,246,0.15)",
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 12
                      }}
                    >
                      ▶ Iniciar
                    </button>
                  )}
               </div>
            </div>

            {/* Notas */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, fontWeight: 700 }}>NOTAS</div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${CARD_BORDER}`,
                  background: "rgba(0,0,0,0.02)",
                  color: TEXT,
                  minHeight: 60,
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedBooking.notes || "Sin notas adicionales."}
              </div>
            </div>

            {/* Botón Eliminar */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => void deleteBooking()}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 13,
                  transition: "0.2s"
                }}
              >
                🗑 Eliminar Reserva
              </button>
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: MUTED, textAlign: "center", opacity: 0.5 }}>
              ID: {selectedBooking.id.slice(0, 8)}...
            </div>

          </div>
        </div>
      ) : null}

      {/* ✅ MODAL: CREAR CLIENTE NUEVO */}
      {showClientModal ? (
        <div
          onClick={() => setShowClientModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 18
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 360,
              background: theme === "dark" ? "rgba(10,15,26,0.95)" : "rgba(255,255,255,0.98)",
              border: `1px solid ${CARD_BORDER}`,
              backdropFilter: "blur(14px)",
              borderRadius: 18,
              padding: 18,
              color: TEXT,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>Registrar Nuevo Cliente</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                autoFocus
                placeholder="Nombre completo *"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: `1px solid ${CARD_BORDER}`, background: "rgba(0,0,0,0.05)", color: TEXT }}
              />
              <input
                placeholder="Teléfono / WhatsApp"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: `1px solid ${CARD_BORDER}`, background: "rgba(0,0,0,0.05)", color: TEXT }}
              />
              <input
                placeholder="Correo electrónico"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                style={{ padding: 12, borderRadius: 12, border: `1px solid ${CARD_BORDER}`, background: "rgba(0,0,0,0.05)", color: TEXT }}
              />
              
              <button
                onClick={() => void createClientOnly()}
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 12,
                  background: "#3b82f6",
                  color: "white",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}