'use client';
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  addDays,
  differenceInMinutes,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

/* ======================
   ✅ ORG FIJA
====================== */
const ORG_ID = 'a573aa05-d62b-44c7-a878-b9138902a094';

/* ======================
   CONFIG GRILLA (PRO)
====================== */
const START_HOUR = 8;
const END_HOUR = 23;
const SLOT_MIN = 30;
const DAY_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;

const CELL_HEIGHT = 40;
const ROOM_COL_WIDTH = 240;
const TIME_COL_WIDTH = 92;

const HEADER_DAY_H = 52;
const HEADER_ROOM_H = 52;

/* ======================
   TIPOS
====================== */
type Room = { id: string; name: string };
type Staff = { id: string; name: string; role: string; active: boolean };
type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
};

type PaymentStatus = 'pending' | 'paid';
type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro';

type BookingBase = {
  id: string;
  org_id?: string;
  room_id: string;
  staff_id: string | null;
  service_id: string | null;

  client_id: string | null;
  client_name: string | null; // respaldo
  client_phone: string | null;

  start_at: string;
  end_at: string;

  duration_minutes: number | null; // ✅
  total_price: number | null; // ✅ (precio calculado sin descuento)

  discount_amount: number | null; // ✅ descuento
  deposit_amount: number | null; // ✅ abono

  payment_status: PaymentStatus | null; // ✅
  payment_method: string | null; // ✅
  paid_at: string | null; // ✅

  notes: string | null;
  color: string | null;
};

type BookingWithClient = BookingBase & {
  clients?: { id: string; full_name: string; avatar_url: string | null } | null;
};

type ViewMode = 'day' | '2days' | 'week';
type MainView = 'calendar' | 'list';

/* ======================
   HELPERS
====================== */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}
function dayKeyFromISO(iso: string) {
  return format(new Date(iso), 'yyyy-MM-dd');
}
function slotIndexToDate(day: Date, slotIndex: number) {
  const base = new Date(day);
  base.setHours(START_HOUR, 0, 0, 0);
  const minutes = slotIndex * SLOT_MIN;
  return new Date(base.getTime() + minutes * 60 * 1000);
}
function getVisibleDays(baseDate: Date, mode: ViewMode) {
  if (mode === 'week') {
    const wStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
  }
  const start = startOfDay(baseDate);
  const count = mode === 'day' ? 1 : 2;
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}
function navStep(mode: ViewMode) {
  return mode === 'week' ? 7 : 1;
}
function getSlotFloatFromISO(iso: string) {
  const d = new Date(iso);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const start = START_HOUR * 60;
  const floatIndex = (minutes - start) / SLOT_MIN;
  return clamp(floatIndex, 0, DAY_SLOTS);
}
function capFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function fmtDayLong(d: Date) {
  return capFirst(format(d, 'EEEE dd/MM', { locale: es }));
}
function fmtDowShort(d: Date) {
  return format(d, 'EE', { locale: es }).toUpperCase();
}

function moneyCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}
function safeInt(n: number | null | undefined) {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}
function calcTotalFromService(svc: Service | null, durationMin: number) {
  if (!svc) return 0;
  if (svc.duration_minutes <= 0) return svc.price || 0;
  // proporcional
  return Math.round((svc.price * durationMin) / svc.duration_minutes);
}
function calcHourlyTotal(hourlyRate: number, durationMin: number) {
  // hourlyRate: CLP por hora
  return Math.round((hourlyRate * durationMin) / 60);
}
function calcDue(totalPrice: number, discount: number) {
  return Math.max(0, totalPrice - discount);
}
function calcBalance(due: number, deposit: number) {
  return Math.max(0, due - deposit);
}
function normalizePaymentStatus(due: number, deposit: number): PaymentStatus {
  return deposit >= due && due > 0 ? 'paid' : 'pending';
}

/* ======================
   UI: Chip cliente con foto
====================== */
function ClientChipWithPhoto({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const safe = (name || 'Cliente').trim();
  const initial = safe?.[0]?.toUpperCase() || 'C';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.25)',
        maxWidth: 190,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={safe}
          width={22}
          height={22}
          style={{
            borderRadius: 999,
            objectFit: 'cover',
            border: '1px solid rgba(255,255,255,0.35)',
            flex: '0 0 auto',
          }}
        />
      ) : (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            fontWeight: 950,
            background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.28)',
            flex: '0 0 auto',
          }}
        >
          {initial}
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={safe}
      >
        {safe}
      </div>
    </div>
  );
}

/* ======================
   DRAGGABLE BOOKING CARD
====================== */
function DraggableBooking({
  booking,
  topPx,
  heightPx,
  labelTop,
  labelBottom,
  badge,
  onDoubleClick,
  onResizeStart,
}: {
  booking: BookingWithClient;
  topPx: number;
  heightPx: number;
  labelTop: string;
  labelBottom: string;
  badge: { text: string; tone: 'paid' | 'pending' };
  onDoubleClick: () => void;
  onResizeStart: (booking: BookingWithClient, startClientY: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
  });

  const displayName = booking.clients?.full_name || booking.client_name || 'Cliente';
  const avatarUrl = booking.clients?.avatar_url || null;

  const style: CSSProperties = {
    position: 'absolute',
    left: 8,
    right: 8,
    top: topPx + 2,
    height: Math.max(heightPx - 4, 28),
    borderRadius: 16,
    padding: '10px 10px',
    border: '1px solid rgba(255,255,255,.22)',
    boxShadow: isDragging ? '0 16px 30px rgba(0,0,0,.28)' : '0 10px 22px rgba(0,0,0,.18)',
    background: booking.color || '#22c55e',
    color: '#fff',
    cursor: 'grab',
    userSelect: 'none',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.92 : 1,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <ClientChipWithPhoto name={displayName} avatarUrl={avatarUrl} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <div
            style={{
              fontWeight: 950,
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 999,
              background: badge.tone === 'paid' ? 'rgba(16,185,129,.24)' : 'rgba(249,115,22,.22)',
              border: '1px solid rgba(255,255,255,.18)',
              whiteSpace: 'nowrap',
            }}
          >
            {badge.text}
          </div>

          <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.95, whiteSpace: 'nowrap' }}>{labelTop}</div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontWeight: 950, fontSize: 12, lineHeight: '16px' }}>{labelBottom}</div>

      {/* Handle Resize */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(booking, e.clientY);
        }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          cursor: 'ns-resize',
          background: 'rgba(255,255,255,.14)',
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
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        background: isOver ? 'rgba(59,130,246,.10)' : 'transparent',
      }}
    />
  );
}

/* ======================
   MINI BAR CHART (semana)
====================== */
function WeekBars({
  items,
}: {
  items: { label: string; total: number; paid: number; pending: number }[];
}) {
  const max = Math.max(1, ...items.map((x) => x.total));
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 10,
        alignItems: 'end',
        height: 120,
        padding: 12,
        borderRadius: 18,
        background: 'white',
        border: '1px solid rgba(15,23,42,0.08)',
        boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
      }}
    >
      {items.map((x) => {
        const h = Math.round((x.total / max) * 80);
        const hp = Math.round((x.paid / max) * 80);
        return (
          <div key={x.label} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div
              style={{
                width: 18,
                height: 90,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}
              title={`${x.label}\nTotal: ${moneyCLP(x.total)}\nPagado: ${moneyCLP(x.paid)}\nPendiente: ${moneyCLP(
                x.pending
              )}`}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: h,
                  background: 'rgba(99,102,241,0.25)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: hp,
                  background: 'rgba(16,185,129,0.55)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a' }}>{x.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const clientsMap = useMemo(() => {
    const m = new Map<string, Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [mainView, setMainView] = useState<MainView>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filtros ULTRA PRO
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterPay, setFilterPay] = useState<'all' | 'pending' | 'paid'>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Crear reserva
  const [roomId, setRoomId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [serviceId, setServiceId] = useState('');

  // Cliente dropdown pro
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const [startAt, setStartAt] = useState('');
  const [notes, setNotes] = useState('');
  const [newColor, setNewColor] = useState('#22c55e');

  // Cobro por hora + descuento
  const [billingMode, setBillingMode] = useState<'service' | 'hourly'>('service');
  const [hourlyRate, setHourlyRate] = useState<number>(20000); // CLP/hora
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [newDeposit, setNewDeposit] = useState<number>(0);

  // Modal editar
  const [selectedBooking, setSelectedBooking] = useState<BookingWithClient | null>(null);
  const [editColor, setEditColor] = useState('#22c55e');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editDeposit, setEditDeposit] = useState<number>(0);
  const [editBillingMode, setEditBillingMode] = useState<'service' | 'hourly'>('service');
  const [editHourlyRate, setEditHourlyRate] = useState<number>(20000);

  // Resize preview
  const [resizePreview, setResizePreview] = useState<{ id: string; end_at: string } | null>(null);
  const resizePreviewRef = useRef<{ id: string; end_at: string } | null>(null);

  const clientBoxRef = useRef<HTMLDivElement | null>(null);

  const days = useMemo(() => getVisibleDays(currentDate, viewMode), [currentDate, viewMode]);

  const timeLabels = useMemo(() => {
    const arr: string[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      arr.push(`${String(h).padStart(2, '0')}:00`);
      arr.push(`${String(h).padStart(2, '0')}:30`);
    }
    return arr;
  }, []);

  const serviceMap = useMemo(() => {
    const m = new Map<string, Service>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? '-';
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? 'Recurso';
  const staffName = (id: string | null) => staff.find((s) => s.id === id)?.name ?? '-';

  const filteredClients = useMemo(() => {
    const q = (clientSearch || '').trim().toLowerCase();
    if (!q) return clients;

    return clients.filter((c) => {
      const name = (c.full_name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [clients, clientSearch]);

  const loadAll = async () => {
    setLoading(true);

    const [roomsRes, staffRes, servicesRes, clientsRes] = await Promise.all([
      supabase.from('rooms').select('id,name').eq('org_id', ORG_ID).order('created_at', { ascending: true }),
      supabase
        .from('staff')
        .select('id,name,role,active')
        .eq('org_id', ORG_ID)
        .eq('active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('services')
        .select('id,name,duration_minutes,price,active')
        .eq('org_id', ORG_ID)
        .eq('active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('clients')
        .select('id,full_name,phone,email,avatar_url')
        .eq('org_id', ORG_ID)
        .order('full_name', { ascending: true }),
    ]);

    if (roomsRes.error) alert('Error rooms: ' + roomsRes.error.message);
    if (staffRes.error) alert('Error staff: ' + staffRes.error.message);
    if (servicesRes.error) alert('Error services: ' + servicesRes.error.message);
    if (clientsRes.error) alert('Error clients: ' + clientsRes.error.message);

    setRooms((roomsRes.data as Room[]) || []);
    setStaff((staffRes.data as Staff[]) || []);
    setServices((servicesRes.data as Service[]) || []);
    setClients((clientsRes.data as Client[]) || []);

    setLoading(false);
  };

  const loadBookingsForVisibleRange = async (visibleDays: Date[]) => {
    if (!visibleDays.length) return;

    const rangeStart = startOfDay(visibleDays[0]);
    const rangeEnd = endOfDay(visibleDays[visibleDays.length - 1]);

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,room_id,staff_id,service_id,
        client_id,client_name,client_phone,
        start_at,end_at,notes,color,
        duration_minutes,total_price,
        discount_amount,deposit_amount,
        payment_status,payment_method,paid_at
        `
      )
      .eq('org_id', ORG_ID)
      .gte('start_at', rangeStart.toISOString())
      .lte('start_at', rangeEnd.toISOString())
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Error cargando reservas (Supabase):', error);
      const msg = (error as any)?.message || (error as any)?.details || 'Error desconocido (revisa RLS/FK/Select)';
      alert('Error cargando reservas: ' + msg);
      return;
    }

    setBookings((data as BookingWithClient[]) || []);
  };

  useEffect(() => {
    (async () => {
      await loadAll();
      await loadBookingsForVisibleRange(getVisibleDays(new Date(), viewMode));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBookingsForVisibleRange(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentDate]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

    const createBooking = async () => {
    if (!roomId) return alert('Selecciona un recurso.');
    if (!clientId) return alert('Selecciona un cliente.');
    if (!startAt) return alert('Selecciona inicio.');

    const client = clients.find((c) => c.id === clientId);
    if (!client) return alert('Cliente inválido.');

    const start = new Date(startAt);

    const svc = serviceId ? serviceMap.get(serviceId) || null : null;
    const duration = svc?.duration_minutes ?? (billingMode === 'hourly' ? 60 : 30);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const totalPrice =
      billingMode === 'hourly'
        ? calcHourlyTotal(hourlyRate, duration)
        : calcTotalFromService(svc, duration);

    const discount = clamp(safeInt(newDiscount), 0, totalPrice);
    const due = calcDue(totalPrice, discount);
    const deposit = clamp(safeInt(newDeposit), 0, due);
    const status: PaymentStatus = normalizePaymentStatus(due, deposit);

    // ✅ Insert y devolvemos ID para notificar
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          org_id: ORG_ID,
          room_id: roomId,
          staff_id: staffId || null,
          service_id: serviceId || null,

          duration_minutes: duration,
          total_price: totalPrice,
          discount_amount: discount,
          deposit_amount: deposit,

          payment_status: status,
          payment_method: status === 'paid' ? 'Efectivo' : null,
          paid_at: status === 'paid' ? new Date().toISOString() : null,

          client_id: client.id,
          client_name: client.full_name,
          client_phone: client.phone || null,

          start_at: start.toISOString(),
          end_at: end.toISOString(),
          notes: notes.trim() || null,
          color: newColor,
        },
      ])
      .select('id')
      .single();

    if (error) {
      alert('No se pudo crear ❌\n' + (error.message || 'Error desconocido'));
      return;
    }

    // ✅ Refrescar UI
    await loadBookingsForVisibleRange(days);

    // ✅ Notificación (Email/SMS) — no rompe si falla
    try {
      if (data?.id) {
        await fetch('/api/notify/booking-created', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: data.id }),
        });
      }
    } catch (notifyErr) {
      console.warn('No se pudo notificar (pero la reserva quedó creada):', notifyErr);
    }

    // ✅ Reset form
    setClientId('');
    setClientSearch('');
    setClientDropdownOpen(false);
    setNotes('');
    setStartAt('');
    setNewDiscount(0);
    setNewDeposit(0);
  };

  const openEdit = (b: BookingWithClient) => {
    setSelectedBooking(b);
    setEditColor(b.color || '#22c55e');
    setEditPaymentMethod(((b.payment_method as PaymentMethod) || 'Efectivo') as PaymentMethod);
    setEditDiscount(safeInt(b.discount_amount));
    setEditDeposit(safeInt(b.deposit_amount));
    setEditBillingMode('service');
    setEditHourlyRate(hourlyRate);
  };

  const saveEdit = async () => {
    if (!selectedBooking) return;

    const durationMin = differenceInMinutes(new Date(selectedBooking.end_at), new Date(selectedBooking.start_at));
    const svc = selectedBooking.service_id ? serviceMap.get(selectedBooking.service_id) || null : null;

    const totalPrice =
      editBillingMode === 'hourly'
        ? calcHourlyTotal(editHourlyRate, durationMin)
        : calcTotalFromService(svc, durationMin);

    const discount = clamp(safeInt(editDiscount), 0, totalPrice);
    const due = calcDue(totalPrice, discount);
    const deposit = clamp(safeInt(editDeposit), 0, due);
    const status: PaymentStatus = normalizePaymentStatus(due, deposit);

    const patch: any = {
      color: editColor,
      duration_minutes: durationMin,
      total_price: totalPrice,
      discount_amount: discount,
      deposit_amount: deposit,
      payment_status: status,
      payment_method: status === 'paid' ? editPaymentMethod : null,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('bookings')
      .update(patch)
      .eq('id', selectedBooking.id)
      .eq('org_id', ORG_ID);

    if (error) return alert('Error guardando ❌\n' + error.message);

    setSelectedBooking(null);
    await loadBookingsForVisibleRange(days);
  };

  const deleteBooking = async () => {
    if (!selectedBooking) return;
    const ok = confirm('¿Eliminar reserva?');
    if (!ok) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', selectedBooking.id)
      .eq('org_id', ORG_ID);

    if (error) {
      alert('Error eliminando: ' + error.message);
      return;
    }

    setSelectedBooking(null);
    await loadBookingsForVisibleRange(days);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const over = event.over;
    if (!over) return;

    const booking = event.active.data.current?.booking as BookingWithClient | undefined;
    if (!booking) return;

    const [newDayKey, newRoomId, slotStr] = String(over.id).split('|');
    const slotIndex = Number(slotStr);

    if (!newDayKey || !newRoomId || Number.isNaN(slotIndex)) return;

    const durationMin = differenceInMinutes(new Date(booking.end_at), new Date(booking.start_at));
    const targetDay = new Date(`${newDayKey}T00:00:00`);
    const safeSlot = clamp(slotIndex, 0, DAY_SLOTS - 1);

    const newStart = slotIndexToDate(targetDay, safeSlot);
    const newEnd = new Date(newStart.getTime() + durationMin * 60 * 1000);

    const svc = booking.service_id ? serviceMap.get(booking.service_id) || null : null;
    const totalPrice = calcTotalFromService(svc, durationMin);

    const discount = clamp(safeInt(booking.discount_amount), 0, totalPrice);
    const due = calcDue(totalPrice, discount);
    const deposit = clamp(safeInt(booking.deposit_amount), 0, due);
    const status: PaymentStatus = normalizePaymentStatus(due, deposit);

    const { error } = await supabase
      .from('bookings')
      .update({
        room_id: newRoomId,
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
        duration_minutes: durationMin,
        total_price: totalPrice,
        payment_status: status,
        payment_method: status === 'paid' ? booking.payment_method || 'Efectivo' : null,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', booking.id)
      .eq('org_id', ORG_ID);

    if (error) {
      alert('No se pudo mover ❌\n' + error.message);
      return;
    }

    await loadBookingsForVisibleRange(days);
  };

  const startResize = (booking: BookingWithClient, startClientY: number) => {
    const startAtMs = new Date(booking.start_at).getTime();
    const originalEndMs = new Date(booking.end_at).getTime();

    const originalSlots = Math.max(1, Math.ceil((originalEndMs - startAtMs) / (SLOT_MIN * 60 * 1000)));
    const minSlots = 1;

    const onMove = (ev: PointerEvent) => {
      const deltaPx = ev.clientY - startClientY;

      const deltaSlots = deltaPx >= 0 ? Math.floor(deltaPx / CELL_HEIGHT) : Math.ceil(deltaPx / CELL_HEIGHT);
      const newSlots = Math.max(minSlots, originalSlots + deltaSlots);

      const newEnd = new Date(startAtMs + newSlots * SLOT_MIN * 60 * 1000).toISOString();

      const next = { id: booking.id, end_at: newEnd };
      resizePreviewRef.current = next;
      setResizePreview(next);
    };

    const onUp = async () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const finalPreview = resizePreviewRef.current;

      if (!finalPreview || finalPreview.id !== booking.id) {
        resizePreviewRef.current = null;
        setResizePreview(null);
        return;
      }

      const newDurationMin = differenceInMinutes(new Date(finalPreview.end_at), new Date(booking.start_at));
      const svc = booking.service_id ? serviceMap.get(booking.service_id) || null : null;
      const totalPrice = calcTotalFromService(svc, newDurationMin);

      const discount = clamp(safeInt(booking.discount_amount), 0, totalPrice);
      const due = calcDue(totalPrice, discount);
      const deposit = clamp(safeInt(booking.deposit_amount), 0, due);
      const status: PaymentStatus = normalizePaymentStatus(due, deposit);

      const { error } = await supabase
        .from('bookings')
        .update({
          end_at: finalPreview.end_at,
          duration_minutes: newDurationMin,
          total_price: totalPrice,
          payment_status: status,
          payment_method: status === 'paid' ? booking.payment_method || 'Efectivo' : null,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', booking.id)
        .eq('org_id', ORG_ID);

      if (error) alert('No se pudo cambiar duración ❌\n' + error.message);

      resizePreviewRef.current = null;
      setResizePreview(null);
      await loadBookingsForVisibleRange(days);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const filteredBookings = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filterRoom !== 'all' && b.room_id !== filterRoom) return false;
      if (filterStaff !== 'all' && (b.staff_id || '') !== filterStaff) return false;
      if (filterPay !== 'all' && (b.payment_status || 'pending') !== filterPay) return false;

      if (!q) return true;

      const client = (b.clients?.full_name || b.client_name || '').toLowerCase();
      const srv = serviceName(b.service_id).toLowerCase();
      const room = roomName(b.room_id).toLowerCase();
      return client.includes(q) || srv.includes(q) || room.includes(q);
    });
  }, [bookings, filterRoom, filterStaff, filterPay, filterSearch, rooms, services]);

  const bookingsByDayRoom = useMemo(() => {
    const map = new Map<string, BookingWithClient[]>();
    for (const b of filteredBookings) {
      const key = `${dayKeyFromISO(b.start_at)}|${b.room_id}`;
      const arr = map.get(key) || [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [filteredBookings]);

  const totalRoomCols = rooms.length * days.length;
  const gridMinWidth = TIME_COL_WIDTH + totalRoomCols * ROOM_COL_WIDTH;

  const visibleBookings = useMemo(() => {
    const visibleDaySet = new Set(days.map((d) => dayKey(d)));
    return filteredBookings.filter((b) => visibleDaySet.has(dayKeyFromISO(b.start_at)));
  }, [filteredBookings, days]);

  const weekChart = useMemo(() => {
    const wStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days7 = Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
    const rows = days7.map((d) => {
      const dk = dayKey(d);
      const items = filteredBookings.filter((b) => dayKeyFromISO(b.start_at) === dk);
      const total = items.reduce((acc, b) => acc + safeInt(b.total_price), 0);
      const disc = items.reduce((acc, b) => acc + safeInt(b.discount_amount), 0);
      const due = calcDue(total, disc);
      const paid = items
        .filter((b) => (b.payment_status || 'pending') === 'paid')
        .reduce((acc, b) => acc + calcDue(safeInt(b.total_price), safeInt(b.discount_amount)), 0);
      const deposits = items.reduce((acc, b) => acc + safeInt(b.deposit_amount), 0);
      const pending = Math.max(0, due - deposits);

      return {
        label: fmtDowShort(d),
        total: due,
        paid,
        pending,
      };
    });
    return rows;
  }, [currentDate, filteredBookings]);

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Inicio', 'Fin', 'Sala', 'Staff', 'Cliente', 'Servicio', 'Duración(min)', 'Total', 'Descuento', 'Abono', 'Por pagar', 'Estado', 'Método'],
      ...visibleBookings.map((b) => {
        const duration = b.duration_minutes ?? differenceInMinutes(new Date(b.end_at), new Date(b.start_at));
        const total = safeInt(b.total_price);
        const disc = safeInt(b.discount_amount);
        const dep = safeInt(b.deposit_amount);
        const due = calcDue(total, disc);
        const bal = calcBalance(due, dep);

        return [
          format(new Date(b.start_at), 'dd/MM/yyyy'),
          format(new Date(b.start_at), 'HH:mm'),
          format(new Date(b.end_at), 'HH:mm'),
          roomName(b.room_id),
          staffName(b.staff_id),
          b.clients?.full_name || b.client_name || '',
          serviceName(b.service_id),
          String(duration),
          String(total),
          String(disc),
          String(dep),
          String(bal),
          (b.payment_status || 'pending') === 'paid' ? 'PAGADO' : 'PENDIENTE',
          b.payment_method || '',
        ];
      }),
    ];

    const csv = rows
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `caja_${format(days[0], 'yyyy-MM-dd')}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : null;
  const headerTitle = viewMode === 'week' ? `Semana ${format(days[0], 'dd/MM')} → ${format(days[6], 'dd/MM')}` : fmtDayLong(days[0]);

  return (
    <div style={{ padding: 24, background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 980, margin: 0, letterSpacing: -0.3 }}>Calendario ✨</h1>
          <div style={{ color: '#64748b', marginTop: 6, fontWeight: 700 }}>{headerTitle}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 10px 26px rgba(0,0,0,0.06)' }}>
            {[
              { id: 'calendar', label: 'Calendario' },
              { id: 'list', label: 'Lista' },
            ].map((b) => {
              const active = mainView === (b.id as MainView);
              return (
                <button
                  key={b.id}
                  onClick={() => setMainView(b.id as MainView)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#ffffff' : 'transparent',
                    boxShadow: active ? '0 10px 22px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: active ? 950 : 800,
                    color: active ? '#0f172a' : '#475569',
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', background: '#eef2ff', padding: 4, borderRadius: 16, border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 10px 26px rgba(0,0,0,0.06)' }}>
            {[
              { id: 'day', label: 'Día' },
              { id: '2days', label: '2 días' },
              { id: 'week', label: 'Semana' },
            ].map((b) => {
              const active = viewMode === (b.id as ViewMode);
              return (
                <button
                  key={b.id}
                  onClick={() => setViewMode(b.id as ViewMode)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#ffffff' : 'transparent',
                    boxShadow: active ? '0 10px 22px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: active ? 950 : 800,
                    color: active ? '#0f172a' : '#475569',
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          <button onClick={() => setCurrentDate((d) => subDays(d, navStep(viewMode)))} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, cursor: 'pointer', background: '#ffffff', boxShadow: '0 10px 26px rgba(0,0,0,0.06)', fontWeight: 900 }}>
            ←
          </button>

          <button onClick={() => setCurrentDate(new Date())} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, cursor: 'pointer', background: '#ffffff', boxShadow: '0 10px 26px rgba(0,0,0,0.06)', fontWeight: 950 }}>
            Hoy
          </button>

          <button onClick={() => setCurrentDate((d) => addDays(d, navStep(viewMode)))} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, cursor: 'pointer', background: '#ffffff', boxShadow: '0 10px 26px rgba(0,0,0,0.06)', fontWeight: 900 }}>
            →
          </button>

          <button onClick={exportCSV} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, cursor: 'pointer', background: '#ffffff', boxShadow: '0 10px 26px rgba(0,0,0,0.06)', fontWeight: 950 }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <WeekBars items={weekChart} />
      </div>

      {/* FILTROS */}
      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: 12, borderRadius: 18, background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 12px 26px rgba(0,0,0,0.06)', maxWidth: 1600 }}>
        <div style={{ fontWeight: 980, color: '#0f172a' }}>Filtros</div>

        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
          <option value="all">Todas las salas</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
          <option value="all">Todo staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>

        <select value={filterPay} onChange={(e) => setFilterPay(e.target.value as any)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
          <option value="all">Pagos: Todos</option>
          <option value="pending">⏳ Pendientes</option>
          <option value="paid">✅ Pagados</option>
        </select>

        <input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Buscar (cliente / servicio / sala)…" style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 320, background: '#fff' }} />

        <div style={{ marginLeft: 'auto', color: '#64748b', fontWeight: 900 }}>{visibleBookings.length} reservas visibles</div>
      </div>

      {/* NUEVA RESERVA */}
      <div style={{ marginTop: 14, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, padding: 14, maxWidth: 1600, background: 'white', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 980, marginBottom: 10, color: '#0f172a' }}>Nueva reserva</div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
            <option value="">Recurso</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select value={billingMode} onChange={(e) => setBillingMode(e.target.value as any)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff', fontWeight: 900 }}>
            <option value="service">Cobro por servicio</option>
            <option value="hourly">Cobro por hora</option>
          </select>

          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
            <option value="">Servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes}m) • {moneyCLP(s.price)}
              </option>
            ))}
          </select>

          {billingMode === 'hourly' && (
            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(safeInt(Number(e.target.value)))} placeholder="Tarifa por hora" style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 180, background: '#fff', fontWeight: 900 }} />
          )}

          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }}>
            <option value="">(Opcional) Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>

          <div ref={clientBoxRef} style={{ position: 'relative' }}>
            <input
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setClientDropdownOpen(true);
              }}
              onFocus={() => setClientDropdownOpen(true)}
              placeholder="Buscar cliente..."
              style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 240, background: '#fff', outline: 'none', fontWeight: 700 }}
            />

            {clientDropdownOpen && clientSearch.trim() && (
              <div style={{ position: 'absolute', top: '110%', left: 0, width: 340, background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.10)', boxShadow: '0 18px 45px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 999 }}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: 12, color: '#64748b', fontWeight: 800 }}>No hay coincidencias 😕</div>
                ) : (
                  filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setClientId(c.id);
                        setClientSearch('');
                        setClientDropdownOpen(false);
                      }}
                      style={{ width: '100%', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', padding: 10, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(15,23,42,0.06)' }}
                    >
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.full_name} width={34} height={34} style={{ borderRadius: 999, objectFit: 'cover', border: '1px solid rgba(15,23,42,0.12)' }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 950, background: '#eef2ff', border: '1px solid rgba(15,23,42,0.12)' }}>
                          {(c.full_name?.[0] || 'C').toUpperCase()}
                        </div>
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{c.phone ? `📞 ${c.phone}` : 'sin teléfono'}</div>
                      </div>
                    </button>
                  ))
                )}

                <a href="/clients" style={{ display: 'block', padding: 12, fontWeight: 950, textDecoration: 'none', color: '#0f172a', background: '#f8fafc' }}>
                  + Crear cliente
                </a>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#0f172a' }}>
            {selectedClient ? (
              <>
                {selectedClient.avatar_url ? <img src={selectedClient.avatar_url} alt={selectedClient.full_name} width={28} height={28} style={{ borderRadius: 999, objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 950, background: '#eef2ff', border: '1px solid rgba(15,23,42,0.12)' }}>{(selectedClient.full_name?.[0] || 'C').toUpperCase()}</div>}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedClient.full_name}</span>
                <button onClick={() => setClientId('')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 950, color: '#64748b' }} title="Quitar cliente">
                  ✕
                </button>
              </>
            ) : (
              <span style={{ color: '#94a3b8' }}>Cliente</span>
            )}
          </div>

          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: '#fff' }} />

          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 260, background: '#fff' }} />

          <input type="number" value={newDiscount} onChange={(e) => setNewDiscount(safeInt(Number(e.target.value)))} placeholder="Descuento" style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 160, background: '#fff', fontWeight: 900 }} />
          <input type="number" value={newDeposit} onChange={(e) => setNewDeposit(safeInt(Number(e.target.value)))} placeholder="Abono" style={{ padding: '10px 12px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, width: 160, background: '#fff', fontWeight: 900 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 950, color: '#0f172a' }}>Color</span>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
          </div>

          <button onClick={createBooking} style={{ padding: '10px 14px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, cursor: 'pointer', fontWeight: 980, background: 'linear-gradient(180deg,#111827,#0b1220)', color: 'white', boxShadow: '0 12px 26px rgba(0,0,0,0.20)' }}>
            Crear
          </button>

          <a href="/clients" style={{ padding: '10px 14px', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 14, background: 'white', fontWeight: 980, textDecoration: 'none', color: '#0f172a', display: 'inline-flex', alignItems: 'center', boxShadow: '0 12px 26px rgba(0,0,0,0.06)' }}>
            + Clientes
          </a>
        </div>
      </div>

      {mainView === 'list' && (
        <div style={{ marginTop: 14, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: '0 14px 34px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: 12, fontWeight: 980, color: '#0f172a', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>Lista (quick edit)</div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Fecha', 'Hora', 'Sala', 'Staff', 'Cliente', 'Servicio', 'Total', 'Desc', 'Abono', 'Saldo', 'Pago', 'Acción'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: 12, fontSize: 12, fontWeight: 980, color: '#0f172a', borderBottom: '1px solid rgba(15,23,42,0.08)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleBookings.map((b) => {
                  const total = safeInt(b.total_price);
                  const disc = safeInt(b.discount_amount);
                  const dep = safeInt(b.deposit_amount);
                  const due = calcDue(total, disc);
                  const bal = calcBalance(due, dep);
                  const isPaid = (b.payment_status || 'pending') === 'paid' || bal === 0;

                  return (
                    <tr key={b.id}>
                      <td style={{ padding: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{format(new Date(b.start_at), 'dd/MM')}</td>
                      <td style={{ padding: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {format(new Date(b.start_at), 'HH:mm')}–{format(new Date(b.end_at), 'HH:mm')}
                      </td>
                      <td style={{ padding: 12, color: '#0f172a', fontWeight: 800 }}>{roomName(b.room_id)}</td>
                      <td style={{ padding: 12, color: '#0f172a', fontWeight: 800 }}>{staffName(b.staff_id)}</td>
                      <td style={{ padding: 12, color: '#0f172a', fontWeight: 900, whiteSpace: 'nowrap' }}>{clientsMap.get(b.client_id || '')?.full_name || b.client_name || 'Cliente'}</td>
                      <td style={{ padding: 12, color: '#0f172a', fontWeight: 800 }}>{serviceName(b.service_id)}</td>
                      <td style={{ padding: 12, fontWeight: 980 }}>{moneyCLP(due)}</td>
                      <td style={{ padding: 12, fontWeight: 900, color: '#64748b' }}>{moneyCLP(disc)}</td>
                      <td style={{ padding: 12, fontWeight: 900, color: '#64748b' }}>{moneyCLP(dep)}</td>
                      <td style={{ padding: 12, fontWeight: 980, color: bal === 0 ? '#16a34a' : '#f97316' }}>{moneyCLP(bal)}</td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={async () => {
                            const next = isPaid ? 'pending' : 'paid';
                            const patch: any = {
                              payment_status: next,
                              payment_method: next === 'paid' ? b.payment_method || 'Efectivo' : null,
                              paid_at: next === 'paid' ? new Date().toISOString() : null,
                            };
                            const { error } = await supabase.from('bookings').update(patch).eq('id', b.id).eq('org_id', ORG_ID);
                            if (error) return alert('Error pago ❌\n' + error.message);
                            await loadBookingsForVisibleRange(days);
                          }}
                          style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', cursor: 'pointer', fontWeight: 980, background: isPaid ? '#ecfdf5' : '#fff7ed', whiteSpace: 'nowrap' }}
                        >
                          {isPaid ? '✅ Pagado' : '⏳ Pendiente'}
                        </button>
                      </td>
                      <td style={{ padding: 12, whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEdit(b)} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', cursor: 'pointer', fontWeight: 980, background: 'white' }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {visibleBookings.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: 16, color: '#64748b', fontWeight: 900 }}>
                      No hay reservas en el rango visible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mainView === 'calendar' && (
        <div style={{ marginTop: 14, border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: '0 14px 34px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: gridMinWidth }}>
              <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.08)', height: HEADER_DAY_H }}>
                <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH, padding: 12, fontWeight: 980, position: 'sticky', left: 0, zIndex: 60, background: 'rgba(255,255,255,0.92)', borderRight: '1px solid rgba(15,23,42,0.08)', color: '#0f172a' }}>
                  Hora
                </div>

                {days.map((d) => (
                  <div key={dayKey(d)} style={{ width: rooms.length * ROOM_COL_WIDTH, minWidth: rooms.length * ROOM_COL_WIDTH, padding: 12, fontWeight: 980, borderLeft: '1px solid rgba(15,23,42,0.06)', whiteSpace: 'nowrap', color: '#0f172a' }}>
                    {fmtDayLong(d)}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', position: 'sticky', top: HEADER_DAY_H, zIndex: 49, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.08)', height: HEADER_ROOM_H }}>
                <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH, position: 'sticky', left: 0, zIndex: 60, background: 'rgba(255,255,255,0.92)', borderRight: '1px solid rgba(15,23,42,0.08)' }} />

                {days.map((d) => (
                  <div key={dayKey(d)} style={{ display: 'flex', borderLeft: '1px solid rgba(15,23,42,0.06)' }}>
                    {rooms.map((r) => (
                      <div key={`${dayKey(d)}-${r.id}`} style={{ width: ROOM_COL_WIDTH, minWidth: ROOM_COL_WIDTH, padding: 12, borderLeft: '1px solid rgba(15,23,42,0.04)', fontWeight: 980, whiteSpace: 'nowrap', color: '#0f172a' }}>
                        {r.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <DndContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH, borderRight: '1px solid rgba(15,23,42,0.08)', position: 'sticky', left: 0, zIndex: 40, background: 'white' }}>
                    {timeLabels.map((t, idx) => (
                      <div key={idx} style={{ height: CELL_HEIGHT, borderBottom: '1px solid rgba(15,23,42,0.06)', padding: '8px 10px', fontSize: 12, color: idx % 2 === 0 ? '#0f172a' : '#94a3b8', fontWeight: idx % 2 === 0 ? 950 : 700 }}>
                        {idx % 2 === 0 ? t : ''}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex' }}>
                    {days.map((day) => {
                      const dk = dayKey(day);
                      return (
                        <div key={dk} style={{ display: 'flex', borderLeft: '1px solid rgba(15,23,42,0.08)' }}>
                          {rooms.map((room) => {
                            const mapKey = `${dk}|${room.id}`;
                            const roomBookings = bookingsByDayRoom.get(mapKey) || [];

                            return (
                              <div key={`${dk}-${room.id}`} style={{ position: 'relative', width: ROOM_COL_WIDTH, minWidth: ROOM_COL_WIDTH, borderLeft: '1px solid rgba(15,23,42,0.04)', background: 'linear-gradient(180deg,#ffffff,#fbfdff)' }}>
                                <div style={{ position: 'relative', height: DAY_SLOTS * CELL_HEIGHT }}>
                                  {Array.from({ length: DAY_SLOTS }).map((_, slotIndex) => (
                                    <SlotDrop key={slotIndex} id={`${dk}|${room.id}|${slotIndex}`} />
                                  ))}

                                  {roomBookings.map((b) => {
                                    const previewEnd = resizePreview?.id === b.id ? resizePreview.end_at : b.end_at;

                                    const slotStart = getSlotFloatFromISO(b.start_at);
                                    const slotEnd = getSlotFloatFromISO(previewEnd);

                                    const top = slotStart * CELL_HEIGHT;
                                    const height = Math.max((slotEnd - slotStart) * CELL_HEIGHT, CELL_HEIGHT);

                                    const labelTop = `${format(new Date(b.start_at), 'HH:mm')}–${format(new Date(previewEnd), 'HH:mm')}`;

                                    const durationMin = differenceInMinutes(new Date(previewEnd), new Date(b.start_at));
                                    const hh = Math.floor(durationMin / 60);
                                    const mm = durationMin % 60;
                                    const durationText = hh > 0 ? `${hh}h${mm > 0 ? ` ${mm}m` : ''}` : `${mm}m`;

                                    const svc = b.service_id ? serviceMap.get(b.service_id) || null : null;

                                    const totalPrice = calcTotalFromService(svc, durationMin);
                                    const discount = clamp(safeInt(b.discount_amount), 0, totalPrice);
                                    const due = calcDue(totalPrice, discount);
                                    const deposit = clamp(safeInt(b.deposit_amount), 0, due);
                                    const balance = calcBalance(due, deposit);

                                    const isPaid = (b.payment_status || 'pending') === 'paid' || balance === 0;

                                    const labelBottom = `${serviceName(b.service_id)} • ${durationText} • ${moneyCLP(due)}${discount > 0 ? ` (desc ${moneyCLP(discount)})` : ''}${deposit > 0 ? ` • abono ${moneyCLP(deposit)}` : ''}`;

                                    const badge = isPaid ? { text: '✅ Pagado', tone: 'paid' as const } : { text: `⏳ ${moneyCLP(balance)}`, tone: 'pending' as const };

                                    return (
                                      <DraggableBooking
                                        key={b.id}
                                        booking={{
                                          ...b,
                                          end_at: previewEnd,
                                          clients: b.client_id
                                            ? {
                                                id: b.client_id,
                                                full_name:
                                                  clientsMap.get(b.client_id)?.full_name ||
                                                  b.client_name ||
                                                  'Cliente',
                                                avatar_url:
                                                  clientsMap.get(b.client_id)?.avatar_url ||
                                                  null,
                                              }
                                            : null,
                                        }}
                                        topPx={top}
                                        heightPx={height}
                                        labelTop={labelTop}
                                        labelBottom={labelBottom}
                                        badge={badge}
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
      )}

      {selectedBooking && (() => {
        const durMin = differenceInMinutes(new Date(selectedBooking.end_at), new Date(selectedBooking.start_at));
        const svc = selectedBooking.service_id ? serviceMap.get(selectedBooking.service_id) || null : null;

        const totalPrice = editBillingMode === 'hourly' ? calcHourlyTotal(editHourlyRate, durMin) : calcTotalFromService(svc, durMin);

        const discount = clamp(safeInt(editDiscount), 0, totalPrice);
        const due = calcDue(totalPrice, discount);
        const deposit = clamp(safeInt(editDeposit), 0, due);
        const balance = calcBalance(due, deposit);

        return (
          <div onClick={() => setSelectedBooking(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 520, background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 14px 40px rgba(0,0,0,.30)', border: '1px solid rgba(15,23,42,0.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div style={{ fontWeight: 980, fontSize: 16 }}>Editar reserva</div>
                <button onClick={() => setSelectedBooking(null)} style={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 14, padding: '8px 10px', cursor: 'pointer', background: 'white', fontWeight: 900 }}>
                  Cerrar
                </button>
              </div>

              <div style={{ marginTop: 12, color: '#475569', fontWeight: 700, lineHeight: 1.6 }}>
                <div>
                  <b style={{ color: '#0f172a' }}>Cliente:</b> {selectedBooking.clients?.full_name || selectedBooking.client_name || 'Cliente'}
                </div>
                <div>
                  <b style={{ color: '#0f172a' }}>Servicio:</b> {serviceName(selectedBooking.service_id)}
                </div>
                <div>
                  <b style={{ color: '#0f172a' }}>Sala:</b> {roomName(selectedBooking.room_id)} • <b style={{ color: '#0f172a' }}>Staff:</b> {staffName(selectedBooking.staff_id)}
                </div>
                <div>
                  <b style={{ color: '#0f172a' }}>Horario:</b> {format(new Date(selectedBooking.start_at), 'HH:mm')}–{format(new Date(selectedBooking.end_at), 'HH:mm')} • <b style={{ color: '#0f172a' }}>Duración:</b> {durMin}m
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontWeight: 980, color: '#0f172a' }}>Cobro:</div>
                <select value={editBillingMode} onChange={(e) => setEditBillingMode(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 900 }}>
                  <option value="service">Servicio</option>
                  <option value="hourly">Hora</option>
                </select>

                {editBillingMode === 'hourly' && (
                  <input type="number" value={editHourlyRate} onChange={(e) => setEditHourlyRate(safeInt(Number(e.target.value)))} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 900, width: 180 }} placeholder="Tarifa por hora" />
                )}

                <div style={{ marginLeft: 'auto', fontWeight: 980, color: '#0f172a' }}>Total: {moneyCLP(totalPrice)}</div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontWeight: 980, color: '#0f172a' }}>Descuento:</div>
                <input type="number" value={editDiscount} onChange={(e) => setEditDiscount(safeInt(Number(e.target.value)))} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 900, width: 160 }} />

                <div style={{ fontWeight: 980, color: '#0f172a' }}>Abono:</div>
                <input type="number" value={editDeposit} onChange={(e) => setEditDeposit(safeInt(Number(e.target.value)))} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 900, width: 160 }} />

                <div style={{ marginLeft: 'auto', fontWeight: 980, color: balance === 0 ? '#16a34a' : '#f97316' }}>Por pagar: {moneyCLP(balance)}</div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontWeight: 980, color: '#0f172a' }}>Método:</div>
                <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 900 }}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>

                <div style={{ fontWeight: 980, color: '#0f172a' }}>Color</div>
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={saveEdit} style={{ flex: 1, padding: '12px 12px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', cursor: 'pointer', fontWeight: 980, background: 'linear-gradient(180deg,#111827,#0b1220)', color: 'white' }}>
                  Guardar
                </button>

                <button onClick={deleteBooking} style={{ padding: '12px 12px', borderRadius: 14, border: '1px solid rgba(15,23,42,0.12)', cursor: 'pointer', fontWeight: 980, background: 'white' }}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: 16 }}>
        <a href="/dashboard" style={{ color: '#0f172a', fontWeight: 900, textDecoration: 'none' }}>
          ← volver al dashboard
        </a>
      </div>
    </div>
  );
}
