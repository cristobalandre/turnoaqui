"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  addDays,
  addWeeks,
  differenceInMinutes,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
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

type Booking = {
  id: string;
  room_id: string;
  staff_id: string | null;
  service_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  start_at: string;
  end_at: string;
  notes: string | null;
  color: string | null;
};

/* ======================
   CONFIG GRILLA
====================== */
const START_HOUR = 8;
const END_HOUR = 23;
const SLOT_MIN = 30; // snap cada 30 minutos

const PX_PER_HOUR = 60; // 60px = 1 hora (30px por slot)
const HEADER_H = 56;
const GRID_BG = "#0b0f1a";
const GRID_LINE = "rgba(255,255,255,0.08)";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.6)";

/* ======================
   HELPERS FECHAS / UI
====================== */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function toLocalISO(date: Date) {
  // Date -> yyyy-MM-ddTHH:mm (para input datetime-local)
  const pad = (x: number) => String(x).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function parseLocalInput(value: string) {
  // yyyy-MM-ddTHH:mm -> Date local
  return new Date(value);
}

function minutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function roundToSlotMin(min: number) {
  const slot = SLOT_MIN;
  return Math.round(min / slot) * slot;
}

function calcTopPx(date: Date) {
  const min = minutesSinceStartOfDay(date);
  const minFromStart = min - START_HOUR * 60;
  return (minFromStart / 60) * PX_PER_HOUR;
}

function calcHeightPx(start: Date, end: Date) {
  const mins = differenceInMinutes(end, start);
  return (mins / 60) * PX_PER_HOUR;
}

function timeLabel(date: Date) {
  return format(date, "HH:mm");
}

/* ======================
   BLOQUE DRAG + RESIZE
====================== */
function DraggableBooking({
  booking,
  topPx,
  heightPx,
  label,
  onDoubleClick,
  onResizeStart,
}: {
  booking: Booking;
  topPx: number;
  heightPx: number;
  label: string;
  onDoubleClick: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
  });

  const style: CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    top: topPx,
    height: heightPx,
    borderRadius: 12,
    background: booking.color || "rgba(59,130,246,0.18)",
    border: `1px solid ${CARD_BORDER}`,
    boxShadow: isDragging ? "0 12px 30px rgba(0,0,0,0.35)" : "0 8px 18px rgba(0,0,0,0.25)",
    padding: "10px 10px 6px",
    cursor: "grab",
    userSelect: "none",
    backdropFilter: "blur(10px)",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
    overflow: "hidden",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onDoubleClick={onDoubleClick}
      {...attributes}
      {...listeners}
      title="Doble click para editar"
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
        {booking.client_phone ? `📞 ${booking.client_phone}` : "—"}
      </div>

      {/* Handle resize (abajo) */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          cursor: "ns-resize",
          opacity: 0.85,
        }}
        title="Arrastra para alargar/acortar"
      />
    </div>
  );
}

function DroppableCell({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        outline: isOver ? "2px solid rgba(59,130,246,0.7)" : "none",
        outlineOffset: -2,
      }}
    />
  );
}

/* ======================
   PAGE
====================== */
export default function CalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(false);

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // form crear booking
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // modal editar / eliminar
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editColor, setEditColor] = useState("#3b82f6");

  // resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeBookingId, setResizeBookingId] = useState<string | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState<Date | null>(null);

  const resizePreviewRef = useMemo(() => ({ current: null as null | Booking }), []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx));
  }, [weekStart]);

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  /* ======================
     ✅ LOAD DATA (con org_id)
  ====================== */
  const loadAll = async () => {
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

    if (roomsRes.error) {
      console.error(roomsRes.error);
      alert("Error cargando rooms: " + roomsRes.error.message);
    }
    if (staffRes.error) {
      console.error(staffRes.error);
      alert("Error cargando staff: " + staffRes.error.message);
    }
    if (servicesRes.error) {
      console.error(servicesRes.error);
      alert("Error cargando services: " + servicesRes.error.message);
    }

    setRooms((roomsRes.data as Room[]) || []);
    setStaff((staffRes.data as Staff[]) || []);
    setServices((servicesRes.data as Service[]) || []);

    setLoading(false);
  };

  const loadBookingsForWeek = async (wStart: Date) => {
    if (!sb) return;

    const rangeStart = startOfDay(wStart);
    const rangeEnd = endOfDay(addDays(wStart, 6));

    const { data, error } = await sb
      .from("bookings")
      .select("id,room_id,staff_id,service_id,client_name,client_phone,start_at,end_at,notes,color")
      .eq("org_id", ORG_ID) // ✅ IMPORTANTÍSIMO
      .gte("start_at", rangeStart.toISOString())
      .lte("start_at", rangeEnd.toISOString())
      .order("start_at", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error cargando reservas: " + error.message);
      setBookings([]);
      return;
    }

    setBookings((data as Booking[]) || []);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadBookingsForWeek(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  /* ======================
     ✅ CREAR RESERVA (con org_id)
  ====================== */
  const createBooking = async () => {
    if (!sb) {
      alert("Supabase no inicializado (revisa env vars en Vercel)");
      return;
    }

    if (!roomId) return alert("Selecciona un recurso.");
    if (!serviceId) return alert("Selecciona un servicio.");
    if (!clientName.trim()) return alert("Nombre cliente requerido.");
    if (!startAt) return alert("Selecciona inicio.");

    const service = serviceMap.get(serviceId);
    const duration = service?.duration_minutes ?? 30;

    const start = new Date(startAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const { error } = await sb.from("bookings").insert([
      {
        org_id: ORG_ID, // ✅ AQUÍ
        room_id: roomId,
        staff_id: staffId || null,
        service_id: serviceId,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        notes: notes.trim() || null,
        color,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error creando reserva: " + error.message);
      return;
    }

    // reset form
    setClientName("");
    setClientPhone("");
    setNotes("");
    setStartAt("");

    await loadBookingsForWeek(weekStart);
  };

  /* ======================
     ✅ EDITAR COLOR / ELIMINAR (seguro por org)
  ====================== */
  const openEdit = (b: Booking) => {
    setSelectedBooking(b);
    setEditColor(b.color || "#3b82f6");
  };

  const saveColor = async () => {
    if (!selectedBooking) return;

    if (!sb) {
      alert("Supabase no inicializado (revisa env vars en Vercel)");
      return;
    }

    const { error } = await sb
      .from("bookings")
      .update({ color: editColor })
      .eq("id", selectedBooking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error guardando color: " + error.message);
      return;
    }

    setSelectedBooking(null);
    await loadBookingsForWeek(weekStart);
  };

  const deleteBooking = async () => {
    if (!sb) {
      alert("Supabase no inicializado (revisa env vars en Vercel)");
      return;
    }

    if (!selectedBooking) return;
    const ok = confirm("¿Eliminar reserva?");
    if (!ok) return;

    const { error } = await sb
      .from("bookings")
      .delete()
      .eq("id", selectedBooking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error eliminando: " + error.message);
      return;
    }

    setSelectedBooking(null);
    await loadBookingsForWeek(weekStart);
  };

  /* ======================
     ✅ DRAG & DROP (move booking)
  ====================== */
  const onDragEnd = async (event: DragEndEvent) => {
    if (!sb) return;

    const { active, over } = event;
    if (!over) return;

    const bookingId = String(active.id);
    const dropId = String(over.id); // roomId|dayIndex

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const [newRoomId, dayIndexStr] = dropId.split("|");
    const dayIndex = Number(dayIndexStr);

    const oldStart = new Date(booking.start_at);
    const oldEnd = new Date(booking.end_at);
    const durationMin = differenceInMinutes(oldEnd, oldStart);

    const targetDay = weekDays[dayIndex];
    if (!targetDay) return;

    // Mantener hora pero mover día
    const newStart = new Date(targetDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + durationMin * 60 * 1000);

    const { error } = await sb
      .from("bookings")
      .update({
        room_id: newRoomId,
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
      })
      .eq("id", booking.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error moviendo reserva: " + error.message);
      return;
    }

    await loadBookingsForWeek(weekStart);
  };

  /* ======================
     ✅ RESIZE (change end_at)
  ====================== */
  const startResize = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeBookingId(booking.id);
    setResizeStartY(e.clientY);
    setResizeOriginalEnd(new Date(booking.end_at));
    resizePreviewRef.current = booking;
    document.body.style.cursor = "ns-resize";
  };

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      if (!resizeBookingId || !resizeOriginalEnd) return;
      const booking = bookings.find((b) => b.id === resizeBookingId);
      if (!booking) return;

      const deltaY = e.clientY - resizeStartY;
      const deltaMinutes = Math.round((deltaY / PX_PER_HOUR) * 60);

      const start = new Date(booking.start_at);
      const oldEnd = resizeOriginalEnd;
      const newEnd = new Date(oldEnd.getTime() + deltaMinutes * 60 * 1000);

      // clamp mínimo 30 min
      const minEnd = new Date(start.getTime() + SLOT_MIN * 60 * 1000);
      const clamped = newEnd < minEnd ? minEnd : newEnd;

      resizePreviewRef.current = { ...booking, end_at: clamped.toISOString() };
      // fuerza re-render suave
      setBookings((prev) => [...prev]);
    };

    const onUp = async () => {
      if (!sb) return;

      setIsResizing(false);
      document.body.style.cursor = "default";

      const booking = bookings.find((b) => b.id === resizeBookingId);
      const finalPreview = resizePreviewRef.current;

      setResizeBookingId(null);

      if (!booking || !finalPreview) return;

      if (finalPreview.end_at === booking.end_at) return;

      const { error } = await sb
        .from("bookings")
        .update({ end_at: finalPreview.end_at })
        .eq("id", booking.id)
        .eq("org_id", ORG_ID);

      if (error) {
        alert("Error ajustando: " + error.message);
        return;
      }

      await loadBookingsForWeek(weekStart);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing, resizeBookingId, resizeOriginalEnd, resizeStartY, bookings]);

  /* ======================
     UI GRID
  ====================== */
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const r of rooms) map.set(r.id, []);
    for (const b of bookings) {
      if (!map.has(b.room_id)) map.set(b.room_id, []);
      map.get(b.room_id)!.push(b);
    }
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      map.set(key, arr);
    }
    return map;
  }, [bookings, rooms]);

  const gridHeightPx = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1000px 700px at 30% 20%, rgba(59,130,246,0.20), transparent 60%),
                    radial-gradient(900px 600px at 70% 60%, rgba(168,85,247,0.16), transparent 55%),
                    ${GRID_BG}`,
        color: TEXT,
        padding: 18,
      }}
    >
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
          boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Calendario</div>
          <div style={{ fontSize: 12, color: MUTED }}>
            Semana: {format(weekStart, "dd MMM")} — {format(addDays(weekStart, 6), "dd MMM")}
          </div>
          {loading ? (
            <div style={{ marginLeft: 10, fontSize: 12, color: MUTED }}>Cargando...</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(255,255,255,0.05)",
              color: TEXT,
              cursor: "pointer",
            }}
          >
            ◀ Semana
          </button>

          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(255,255,255,0.05)",
              color: TEXT,
              cursor: "pointer",
            }}
          >
            Hoy
          </button>

          <button
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            style={{
              padding: "8px 12px",
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(255,255,255,0.05)",
              color: TEXT,
              cursor: "pointer",
            }}
          >
            Semana ▶
          </button>
        </div>
      </div>

      {/* Form */}
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
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Crear reserva</div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10 }}>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          >
            <option value="">Sala / Recurso</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          >
            <option value="">Servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes}m)
              </option>
            ))}
          </select>

          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          >
            <option value="">Staff (opcional)</option>
            {staff.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre cliente"
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          />

          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          />

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            style={{
              padding: 10,
              borderRadius: 14,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(0,0,0,0.25)",
              color: TEXT,
            }}
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 44, height: 40, borderRadius: 12, border: `1px solid ${CARD_BORDER}` }}
              title="Color del bloque"
            />

            <button
              onClick={() => void createBooking()}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 14,
                border: `1px solid ${CARD_BORDER}`,
                background: "rgba(59,130,246,0.22)",
                color: TEXT,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              + Crear
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${CARD_BORDER}`,
          background: CARD_BG,
          backdropFilter: "blur(14px)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${weekDays.length}, 1fr)` }}>
          {/* Head left */}
          <div style={{ padding: 12, borderBottom: `1px solid ${GRID_LINE}`, color: MUTED, fontSize: 12 }}>
            Hora
          </div>

          {weekDays.map((d, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                borderBottom: `1px solid ${GRID_LINE}`,
                borderLeft: `1px solid ${GRID_LINE}`,
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {format(d, "EEE dd")}
            </div>
          ))}
        </div>

        <DndContext onDragEnd={onDragEnd}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                display: "grid",
                gridTemplateColumns: `140px repeat(${weekDays.length}, 1fr)`,
                borderTop: `1px solid ${GRID_LINE}`,
              }}
            >
              {/* Room name */}
              <div style={{ padding: 12, borderRight: `1px solid ${GRID_LINE}` }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{room.name}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
                  {bookingsByRoom.get(room.id)?.length || 0} reservas
                </div>
              </div>

              {/* Days columns */}
              {weekDays.map((day, dayIdx) => {
                const cellId = `${room.id}|${dayIdx}`;

                // bookings in this room/day
                const dayBookings =
                  (bookingsByRoom.get(room.id) || []).filter((b) => {
                    const d0 = new Date(b.start_at);
                    return (
                      d0.getFullYear() === day.getFullYear() &&
                      d0.getMonth() === day.getMonth() &&
                      d0.getDate() === day.getDate()
                    );
                  }) || [];

                return (
                  <div
                    key={cellId}
                    style={{
                      position: "relative",
                      height: gridHeightPx,
                      borderLeft: `1px solid ${GRID_LINE}`,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                    }}
                  >
                    {/* Droppable */}
                    <DroppableCell id={cellId} />

                    {/* Hour lines */}
                    {hours.map((h) => {
                      const top = (h - START_HOUR) * PX_PER_HOUR;
                      return (
                        <div
                          key={h}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top,
                            borderTop: `1px solid ${GRID_LINE}`,
                            opacity: 0.6,
                          }}
                        />
                      );
                    })}

                    {/* Bookings */}
                    {dayBookings.map((b) => {
                      const start = new Date(b.start_at);
                      const end = new Date(b.end_at);

                      const topPx = calcTopPx(start);
                      const heightPx = calcHeightPx(start, end);

                      const serviceName =
                        services.find((s) => s.id === b.service_id)?.name || "Servicio";
                      const label = `${timeLabel(start)} — ${serviceName} • ${b.client_name || "Cliente"}`;

                      return (
                        <DraggableBooking
                          key={b.id}
                          booking={b}
                          topPx={topPx}
                          heightPx={heightPx}
                          label={label}
                          onDoubleClick={() => openEdit(b)}
                          onResizeStart={(e) => startResize(b, e)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </DndContext>
      </div>

      {/* Modal editar */}
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
              width: "min(520px, 92vw)",
              borderRadius: 18,
              border: `1px solid ${CARD_BORDER}`,
              background: "rgba(20,24,34,0.92)",
              backdropFilter: "blur(14px)",
              padding: 16,
              boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Editar reserva</div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  border: `1px solid ${CARD_BORDER}`,
                  background: "rgba(255,255,255,0.05)",
                  color: TEXT,
                  padding: "6px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
              {selectedBooking.client_name || "Cliente"} • {format(new Date(selectedBooking.start_at), "dd/MM HH:mm")}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
              <div style={{ fontSize: 12, color: MUTED }}>Color:</div>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                style={{ width: 50, height: 38, borderRadius: 12, border: `1px solid ${CARD_BORDER}` }}
              />
              <button
                onClick={() => void saveColor()}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: `1px solid ${CARD_BORDER}`,
                  background: "rgba(34,197,94,0.20)",
                  color: TEXT,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Guardar
              </button>
            </div>

            <button
              onClick={() => void deleteBooking()}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 14,
                border: `1px solid ${CARD_BORDER}`,
                background: "rgba(239,68,68,0.20)",
                color: TEXT,
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
