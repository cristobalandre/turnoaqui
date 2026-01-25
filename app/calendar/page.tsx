"use client";

export const dynamic = "force-dynamic"
export const revalidate = 0

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
import { createBrowserClient } from "@supabase/ssr"

/* ======================
   ✅ ORG FIJA
====================== */
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";



// --- Supabase browser client (lazy init) ---
const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null)

const getSupabase = () => {
  // Avoid creating client during SSR / build
  if (typeof window === "undefined") return null

  if (!supabaseRef.current) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) return null
    supabaseRef.current = createBrowserClient(url, key)
  }

  return supabaseRef.current
}
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
const DAY_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

const CELL_HEIGHT = 28; // px por slot
const ROOM_COL_WIDTH = 220;
const TIME_COL_WIDTH = 84;

// alturas headers para sticky top
const HEADER_DAY_H = 46;
const HEADER_ROOM_H = 44;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function dayKeyFromISO(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}

function getSlotIndexFromISO(iso: string) {
  const d = new Date(iso);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const start = START_HOUR * 60;
  return Math.floor((minutes - start) / SLOT_MIN);
}

function slotIndexToDate(day: Date, slotIndex: number) {
  const base = new Date(day);
  base.setHours(START_HOUR, 0, 0, 0);
  const minutes = slotIndex * SLOT_MIN;
  return new Date(base.getTime() + minutes * 60 * 1000);
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
  onResizeStart: (booking: Booking, startClientY: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
  });

  const style: CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    top: topPx,
    height: Math.max(heightPx, 22),
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(0,0,0,.08)",
    boxShadow: isDragging ? "0 12px 22px rgba(0,0,0,.22)" : "0 6px 14px rgba(0,0,0,.10)",
    background: booking.color || "#3b82f6",
    color: "#fff",
    cursor: "grab",
    userSelect: "none",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.92 : 1,
    overflow: "hidden",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={onDoubleClick}
      title="Arrastra para mover | Doble click para editar | Arrastra abajo para cambiar duración"
    >
      <div style={{ fontWeight: 950, fontSize: 12, lineHeight: "16px" }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.95 }}>{booking.client_name || "Cliente"}</div>

      {/* Handle Resize abajo */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(booking, e.clientY);
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          cursor: "ns-resize",
          background: "rgba(255,255,255,.18)",
        }}
      />
    </div>
  );
}

/* ======================
   SLOT DROPPABLE
====================== */
function SlotDrop({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        height: CELL_HEIGHT,
        borderBottom: "1px solid #f2f2f2",
        background: isOver ? "rgba(59,130,246,.10)" : "transparent",
      }}
    />
  );
}

/* ======================
   PÁGINA PRINCIPAL
====================== */
export default function CalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Modal editar
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editColor, setEditColor] = useState("#3b82f6");

  // Crear reserva
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  // Resize live preview
  const [resizePreview, setResizePreview] = useState<{ id: string; end_at: string } | null>(null);
  const resizePreviewRef = useRef<{ id: string; end_at: string } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const timeLabels = useMemo(() => {
    const arr: string[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      arr.push(`${String(h).padStart(2, "0")}:00`);
      arr.push(`${String(h).padStart(2, "0")}:30`);
    }
    return arr;
  }, []);

  const serviceMap = useMemo(() => {
    const m = new Map<string, Service>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? "-";
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? "Recurso";

  /* ======================
     ✅ LOAD DATA (con org_id)
  ====================== */
  const loadAll = async () => {
    setLoading(true);

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

    if (roomsRes.error) alert("Error rooms: " + roomsRes.error.message);
    if (staffRes.error) alert("Error staff: " + staffRes.error.message);
    if (servicesRes.error) alert("Error services: " + servicesRes.error.message);

    setRooms((roomsRes.data as Room[]) || []);
    setStaff((staffRes.data as Staff[]) || []);
    setServices((servicesRes.data as Service[]) || []);

    setLoading(false);
  };

  const loadBookingsForWeek = async (wStart: Date) => {
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
      return;
    }

    setBookings((data as Booking[]) || []);
  };

  useEffect(() => {
    (async () => {
      await loadAll();
      await loadBookingsForWeek(weekStart);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBookingsForWeek(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  /* ======================
     ✅ CREAR RESERVA (con org_id)
  ====================== */
  const createBooking = async () => {

const sb = getSupabase()
if (!sb) {
  throw new Error("Supabase URL/ANON KEY missing (check Vercel env vars)")
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
        color: newColor,
      },
    ]);

    if (error) {
      alert("No se pudo crear ❌\n" + error.message);
      return;
    }

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

const sb = getSupabase()
if (!sb) {
  throw new Error("Supabase URL/ANON KEY missing (check Vercel env vars)")
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
     ✅ DRAG (MOVER) (seguro por org)
     droppable id = `${dayKey}|${roomId}|${slotIndex}`
  ====================== */
  const onDragEnd = async (event: DragEndEvent) => {
    const over = event.over;
    if (!over) return;

    const booking = event.active.data.current?.booking as Booking | undefined;
    if (!booking) return;

    const [newDayKey, newRoomId, slotStr] = String(over.id).split("|");
    const slotIndex = Number(slotStr);

    if (!newDayKey || !newRoomId || Number.isNaN(slotIndex)) return;

    const durationMin = differenceInMinutes(new Date(booking.end_at), new Date(booking.start_at));

    const targetDay = new Date(`${newDayKey}T00:00:00`);
    const safeSlot = clamp(slotIndex, 0, DAY_SLOTS - 1);

    const newStart = slotIndexToDate(targetDay, safeSlot);
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
      alert("No se pudo mover ❌\n" + error.message);
      return;
    }

    await loadBookingsForWeek(weekStart);
  };

  /* ======================
     ✅ RESIZE (DURACIÓN) (seguro por org)
  ====================== */
  const startResize = (booking: Booking, startClientY: number) => {
    const startAtMs = new Date(booking.start_at).getTime();
    const originalEndMs = new Date(booking.end_at).getTime();

    const originalSlots = Math.max(1, Math.round((originalEndMs - startAtMs) / (SLOT_MIN * 60 * 1000)));
    const minSlots = 1;

    const onMove = (ev: PointerEvent) => {
      const deltaPx = ev.clientY - startClientY;
      const deltaSlots = Math.round(deltaPx / CELL_HEIGHT);

      const newSlots = Math.max(minSlots, originalSlots + deltaSlots);
      const newEnd = new Date(startAtMs + newSlots * SLOT_MIN * 60 * 1000).toISOString();

      const next = { id: booking.id, end_at: newEnd };
      resizePreviewRef.current = next;
      setResizePreview(next);
    };

    const onUp = async () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const finalPreview = resizePreviewRef.current;

      if (!finalPreview || finalPreview.id !== booking.id) {
        resizePreviewRef.current = null;
        setResizePreview(null);
        return;
      }

      const { error } = await sb
        .from("bookings")
        .update({ end_at: finalPreview.end_at })
        .eq("id", booking.id)
        .eq("org_id", ORG_ID);

      if (error) {
        alert("No se pudo cambiar duración ❌\n" + error.message);
      }

      resizePreviewRef.current = null;
      setResizePreview(null);
      await loadBookingsForWeek(weekStart);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* ======================
     AGRUPACIÓN RESERVAS POR DÍA+SALA
  ====================== */
  const bookingsByDayRoom = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = `${dayKeyFromISO(b.start_at)}|${b.room_id}`;
      const arr = map.get(key) || [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  const totalRoomCols = rooms.length * 7;
  const gridMinWidth = TIME_COL_WIDTH + totalRoomCols * ROOM_COL_WIDTH;

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 980, margin: 0 }}>Agenda Week Full 🤯💥</h1>
          <div style={{ color: "#666", marginTop: 4 }}>
            Semana desde: <b>{format(weekStart, "yyyy-MM-dd")}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, cursor: "pointer" }}
          >
            ← Semana
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, cursor: "pointer" }}
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, cursor: "pointer" }}
          >
            Semana →
          </button>
        </div>
      </div>

      {/* CREAR RESERVA */}
      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 14, padding: 14, maxWidth: 1600 }}>
        <div style={{ fontWeight: 980, marginBottom: 10 }}>Nueva reserva</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12 }}
          >
            <option value="">Recurso</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12 }}
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
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12 }}
          >
            <option value="">(Opcional) Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>

          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Cliente"
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, width: 220 }}
          />

          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, width: 200 }}
          />

          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12 }}
          />

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 12, width: 260 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 950 }}>Color</span>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
          </div>

          <button
            onClick={createBooking}
            style={{
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 980,
            }}
          >
            Crear
          </button>
        </div>
      </div>

      {/* ✅ CALENDARIO */}
      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: gridMinWidth }}>
            {/* HEADER DÍAS */}
            <div
              style={{
                display: "flex",
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "#fafafa",
                borderBottom: "1px solid #eee",
                height: HEADER_DAY_H,
              }}
            >
              <div
                style={{
                  width: TIME_COL_WIDTH,
                  minWidth: TIME_COL_WIDTH,
                  padding: 10,
                  fontWeight: 980,
                  position: "sticky",
                  left: 0,
                  zIndex: 60,
                  background: "#fafafa",
                  borderRight: "1px solid #eee",
                }}
              >
                Hora
              </div>

              {days.map((d) => (
                <div
                  key={dayKey(d)}
                  style={{
                    width: rooms.length * ROOM_COL_WIDTH,
                    minWidth: rooms.length * ROOM_COL_WIDTH,
                    padding: 10,
                    fontWeight: 980,
                    borderLeft: "1px solid #eee",
                    whiteSpace: "nowrap",
                  }}
                >
                  {format(d, "EEEE dd/MM")}
                </div>
              ))}
            </div>

            {/* HEADER SALAS */}
            <div
              style={{
                display: "flex",
                position: "sticky",
                top: HEADER_DAY_H,
                zIndex: 49,
                background: "#fff",
                borderBottom: "1px solid #eee",
                height: HEADER_ROOM_H,
              }}
            >
              <div
                style={{
                  width: TIME_COL_WIDTH,
                  minWidth: TIME_COL_WIDTH,
                  position: "sticky",
                  left: 0,
                  zIndex: 60,
                  background: "#fff",
                  borderRight: "1px solid #eee",
                }}
              />
              {days.map((d) => (
                <div key={dayKey(d)} style={{ display: "flex", borderLeft: "1px solid #eee" }}>
                  {rooms.map((r) => (
                    <div
                      key={`${dayKey(d)}-${r.id}`}
                      style={{
                        width: ROOM_COL_WIDTH,
                        minWidth: ROOM_COL_WIDTH,
                        padding: 10,
                        borderLeft: "1px solid #f3f3f3",
                        fontWeight: 950,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* BODY */}
            <DndContext onDragEnd={onDragEnd}>
              <div style={{ display: "flex" }}>
                {/* Columna horas */}
                <div
                  style={{
                    width: TIME_COL_WIDTH,
                    minWidth: TIME_COL_WIDTH,
                    borderRight: "1px solid #eee",
                    position: "sticky",
                    left: 0,
                    zIndex: 40,
                    background: "#fff",
                  }}
                >
                  {timeLabels.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: CELL_HEIGHT,
                        borderBottom: "1px solid #f2f2f2",
                        padding: "4px 8px",
                        fontSize: 12,
                        color: idx % 2 === 0 ? "#333" : "#999",
                        fontWeight: idx % 2 === 0 ? 950 : 600,
                      }}
                    >
                      {idx % 2 === 0 ? t : ""}
                    </div>
                  ))}
                </div>

                {/* Semana */}
                <div style={{ display: "flex" }}>
                  {days.map((day) => {
                    const dk = dayKey(day);
                    return (
                      <div key={dk} style={{ display: "flex", borderLeft: "1px solid #eee" }}>
                        {rooms.map((room) => {
                          const mapKey = `${dk}|${room.id}`;
                          const roomBookings = bookingsByDayRoom.get(mapKey) || [];

                          return (
                            <div
                              key={`${dk}-${room.id}`}
                              style={{
                                position: "relative",
                                width: ROOM_COL_WIDTH,
                                minWidth: ROOM_COL_WIDTH,
                                borderLeft: "1px solid #f3f3f3",
                              }}
                            >
                              <div style={{ position: "relative", height: DAY_SLOTS * CELL_HEIGHT }}>
                                {/* Slots */}
                                {Array.from({ length: DAY_SLOTS }).map((_, slotIndex) => (
                                  <SlotDrop key={slotIndex} id={`${dk}|${room.id}|${slotIndex}`} />
                                ))}

                                {/* Bookings */}
                                {roomBookings.map((b) => {
                                  const previewEnd = resizePreview?.id === b.id ? resizePreview.end_at : b.end_at;

                                  const slotStart = getSlotIndexFromISO(b.start_at);
                                  const slotEnd = getSlotIndexFromISO(previewEnd);

                                  const top = clamp(slotStart, 0, DAY_SLOTS) * CELL_HEIGHT;
                                  const height = clamp(slotEnd - slotStart, 1, DAY_SLOTS) * CELL_HEIGHT;

                                  const label = `${format(new Date(b.start_at), "HH:mm")}–${format(
                                    new Date(previewEnd),
                                    "HH:mm"
                                  )} · ${serviceName(b.service_id)}`;

                                  return (
                                    <DraggableBooking
                                      key={b.id}
                                      booking={{ ...b, end_at: previewEnd }}
                                      topPx={top}
                                      heightPx={height}
                                      label={label}
                                      onDoubleClick={() => openEdit(b)}
                                      onResizeStart={startResize}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </DndContext>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR */}
      {selectedBooking && (
        <div
          onClick={() => setSelectedBooking(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              background: "#fff",
              borderRadius: 14,
              padding: 14,
              boxShadow: "0 12px 30px rgba(0,0,0,.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 980 }}>Editar reserva</div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginTop: 10, color: "#666" }}>
              <div>
                <b>Día:</b> {format(new Date(selectedBooking.start_at), "EEEE dd/MM")}
              </div>
              <div>
                <b>Sala:</b> {roomName(selectedBooking.room_id)}
              </div>
              <div>
                <b>Servicio:</b> {serviceName(selectedBooking.service_id)}
              </div>
              <div>
                <b>Cliente:</b> {selectedBooking.client_name}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <b>Color</b>
              <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button
                onClick={saveColor}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  fontWeight: 980,
                }}
              >
                Guardar color
              </button>

              <button
                onClick={deleteBooking}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  fontWeight: 980,
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <a href="/dashboard">← volver al dashboard</a>
      </div>
    </div>
  );
}