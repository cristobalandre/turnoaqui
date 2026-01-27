"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, addDays, startOfWeek, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMinutes, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ESTILOS ---
const CARD_BG = "#1e1e1e";
const ACCENT = "#3b82f6"; 
const TEXT_MAIN = "#ffffff";
const TEXT_MUTED = "#a1a1aa";
const BORDER = "#333333";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [defaultService, setDefaultService] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData } = await supabase.from("rooms").select("*").order("name");
      if (roomsData) {
        setRooms(roomsData);
        if(roomsData.length > 0) setSelectedRoom(roomsData[0]);
      }
      const { data: servicesData } = await supabase.from("services").select("*").limit(1);
      if (servicesData && servicesData.length > 0) {
        setDefaultService(servicesData[0]);
      }
      setLoadingRooms(false);
    };
    fetchData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    if (!selectedDate || !selectedRoom) return;

    const fetchAvailability = async () => {
      setLoadingHours(true);
      const startOfSelected = startOfDay(selectedDate);
      const endOfSelected = new Date(selectedDate);
      endOfSelected.setHours(23, 59, 59, 999);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("room_id", selectedRoom.id)
        .gte("start_at", startOfSelected.toISOString())
        .lte("start_at", endOfSelected.toISOString());

      const slots = [];
      const now = new Date();
      let cursor = new Date(selectedDate);
      cursor.setHours(10, 0, 0, 0); 
      const closeTime = new Date(selectedDate);
      closeTime.setHours(20, 0, 0, 0);

      while (cursor < closeTime) {
        const slotStart = new Date(cursor);
        const slotEnd = addMinutes(cursor, 60);

        const isBusy = bookings?.some(b => {
          const bStart = new Date(b.start_at);
          const bEnd = new Date(b.end_at);
          return (slotStart < bEnd && slotEnd > bStart);
        });

        // 🟢 VALIDACIÓN CRUCIAL: No mostrar horas que ya pasaron (con margen de 15 min)
        const isPastTime = isBefore(slotStart, addMinutes(now, 15));

        if (!isBusy && !isPastTime) {
          slots.push(format(slotStart, "HH:mm"));
        }
        cursor = addMinutes(cursor, 30);
      }
      setAvailableSlots(slots);
      setLoadingHours(false);
    };

    fetchAvailability();
  }, [selectedDate, selectedRoom]);

  const handleBooking = async () => {
    if (!clientName || !clientPhone) {
      alert("Por favor completa tu nombre y teléfono");
      return;
    }
    setIsBooking(true);
    try {
      const [hours, minutes] = selectedTime!.split(":").map(Number);
      const startAt = new Date(selectedDate!);
      startAt.setHours(hours, minutes, 0, 0);
      const endAt = addMinutes(startAt, 60);

      const { error } = await supabase.from("bookings").insert({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        client_name: clientName,
        room_id: selectedRoom.id,
        org_id: selectedRoom.org_id, 
        service_id: defaultService?.id, 
        color: "#3b82f6", 
        payment_status: "pending",
        notes: `Reserva Web - WhatsApp: ${clientPhone} - Email: ${clientEmail}`
      });
      if (error) throw error;
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: step === 4 ? "1fr" : "300px 1fr", background: CARD_BG, borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", overflow: "hidden", maxWidth: 950, width: "100%", minHeight: 550 }}>
        {step === 4 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 70, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 32, marginBottom: 10 }}>¡Reserva Confirmada!</h2>
            <p style={{ color: TEXT_MUTED, maxWidth: 400, marginBottom: 30, lineHeight: 1.5 }}>
              Listo <b>{clientName}</b>. Tu sesión en <b>{selectedRoom?.name}</b> ha quedado agendada para el <b>{format(selectedDate!, "d 'de' MMMM", { locale: es })}</b> a las <b>{selectedTime}</b>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => window.location.reload()} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}>Volver al inicio</button>
              <a href={`https://wa.me/?text=Hola, he reservado hora para el ${format(selectedDate!, "dd/MM")} a las ${selectedTime}`} target="_blank" style={{ padding: "12px 24px", borderRadius: 12, background: "#22c55e", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>📲 Avisar por WhatsApp</a>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: 30, borderRight: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #ea580c)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💈</div>
              <h2 style={{ color: TEXT_MAIN, margin: "0 0 5px 0", fontSize: 20 }}>Turno Aquí</h2>
              <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>Agenda profesional</p>
              <div style={{ marginTop: 40, flex: 1 }}>
                <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>ESPACIO SELECCIONADO</div><div style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: 600 }}>{selectedRoom ? selectedRoom.name : "Cargando..."}</div></div>
                {selectedDate && (<div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>FECHA</div><div style={{ color: TEXT_MAIN, fontSize: 16 }}>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</div></div>)}
                {selectedTime && (<div><div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>HORA</div><div style={{ color: ACCENT, fontSize: 24, fontWeight: "bold" }}>{selectedTime}</div></div>)}
              </div>
            </div>

            <div style={{ padding: 30 }}>
              {step === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 30 }}>
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", color: TEXT_MUTED, fontSize: 12, marginBottom: 8 }}>¿Dónde quieres agendar?</label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {rooms.map(room => (
                          <button key={room.id} onClick={() => setSelectedRoom(room)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${selectedRoom?.id === room.id ? ACCENT : BORDER}`, background: selectedRoom?.id === room.id ? "rgba(59, 130, 246, 0.1)" : "transparent", color: selectedRoom?.id === room.id ? ACCENT : TEXT_MUTED, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{room.name}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, color: TEXT_MAIN, alignItems: "center" }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{format(currentMonth, "MMMM yyyy", { locale: es })}</span>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer" }}>◀</button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer" }}>▶</button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, textAlign: "center", fontSize: 11, color: TEXT_MUTED, marginBottom: 10 }}>
                      {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
                      {calendarDays.map((day, i) => {
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        // 🟢 BLOQUEO DE DÍAS PASADOS
                        const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                        return (
                          <button
                            key={i}
                            onClick={() => { if(!isPast) { setSelectedDate(day); setSelectedTime(null); } }}
                            disabled={!isCurrentMonth || isPast}
                            style={{
                              aspectRatio: "1/1", borderRadius: 8, border: "none",
                              background: isSelected ? ACCENT : isToday(day) ? "rgba(255,255,255,0.05)" : "transparent",
                              color: isSelected ? "white" : isPast ? "#333" : isCurrentMonth ? TEXT_MAIN : "#333",
                              cursor: (isCurrentMonth && !isPast) ? "pointer" : "default", opacity: isPast ? 0.4 : 1, fontSize: 13
                            }}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 20 }}>
                     <div style={{ color: TEXT_MAIN, fontSize: 14, marginBottom: 15, fontWeight: 600 }}>Horarios</div>
                     {loadingHours ? (
                       <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Buscando espacios...</div>
                     ) : availableSlots.length > 0 ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: 8, height: 350, overflowY: "auto", paddingRight: 5 }}>
                         {availableSlots.map(time => (
                           <button key={time} onClick={() => setSelectedTime(time)} style={{ padding: "10px", borderRadius: 8, border: `1px solid ${selectedTime === time ? ACCENT : BORDER}`, background: selectedTime === time ? ACCENT : "rgba(255,255,255,0.03)", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, textAlign: "center" }}>{time}</button>
                         ))}
                       </div>
                     ) : (
                       <div style={{ color: TEXT_MUTED, fontSize: 12, fontStyle: "italic" }}>No hay horas libres para hoy.</div>
                     )}
                     {selectedTime && (
                       <button onClick={() => setStep(2)} style={{ width: "100%", marginTop: 20, padding: 12, borderRadius: 8, background: "white", color: "black", fontWeight: 900, border: "none", cursor: "pointer" }}>Continuar →</button>
                     )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ maxWidth: 400, margin: "0 auto", color: "white" }}>
                  <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", marginBottom: 20, fontSize: 14 }}>← Volver a elegir hora</button>
                  <h3 style={{ margin: "0 0 25px 0", fontSize: 24 }}>Casi listo...</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div><label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>Tu Nombre</label><input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej: Cristóbal Vergara" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} /></div>
                    <div><label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>WhatsApp (para confirmarte)</label><input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+569..." style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} /></div>
                    <div><label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>Email (opcional)</label><input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="correo@ejemplo.com" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} /></div>
                    <button onClick={handleBooking} disabled={isBooking} style={{ marginTop: 10, padding: 16, borderRadius: 12, background: ACCENT, color: "white", fontWeight: 900, border: "none", cursor: isBooking ? "wait" : "pointer", fontSize: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>{isBooking ? "Guardando..." : "✅ Confirmar Reserva"}</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}