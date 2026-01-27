"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, addDays, startOfWeek, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMinutes } from "date-fns";
import { es } from "date-fns/locale";

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ESTILOS ---
const CARD_BG = "#1e1e1e";
const ACCENT = "#3b82f6"; // Azul Weezly
const TEXT_MAIN = "#ffffff";
const TEXT_MUTED = "#a1a1aa";
const BORDER = "#333333";

export default function BookingPage() {
  // --- ESTADOS DE LA APP ---
  const [step, setStep] = useState(1); // 1: Servicio/Sala, 2: Fecha, 3: Datos, 4: Éxito
  
  // Datos traídos de BD
  const [rooms, setRooms] = useState<any[]>([]);
  const [defaultService, setDefaultService] = useState<any>(null); // <--- NUEVO: Para evitar el error fantasma
  
  // Selección del Cliente
  const [selectedRoom, setSelectedRoom] = useState<any>(null); // La sala elegida
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Formulario Cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Carga
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 1. CARGAR DATOS AL INICIO (Salas y Servicio por defecto)
  useEffect(() => {
    const fetchData = async () => {
      // A. Cargar Salas
      const { data: roomsData } = await supabase.from("rooms").select("*").order("name");
      if (roomsData) {
        setRooms(roomsData);
        if(roomsData.length > 0) setSelectedRoom(roomsData[0]);
      }

      // B. Cargar Servicios (NUEVO: Traemos uno para usar de respaldo)
      const { data: servicesData } = await supabase.from("services").select("*").limit(1);
      if (servicesData && servicesData.length > 0) {
        setDefaultService(servicesData[0]);
      }
      
      setLoadingRooms(false);
    };
    fetchData();
  }, []);

  // 2. LOGICA DEL CALENDARIO (Generar días)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // 3. BUSCAR HORAS DISPONIBLES (Filtrando por la Sala elegida)
  useEffect(() => {
    if (!selectedDate || !selectedRoom) return;

    const fetchAvailability = async () => {
      setLoadingHours(true);
      setAvailableSlots([]);

      // Definir inicio y fin del día seleccionado
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // CONSULTA CLAVE: Traer reservas SOLO de la sala elegida
      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("room_id", selectedRoom.id) // <--- FILTRO IMPORTANTE
        .gte("start_at", startOfDay.toISOString())
        .lte("start_at", endOfDay.toISOString());

      // Generar horario comercial (Ej: 10:00 a 20:00)
      const slots = [];
      let cursor = new Date(selectedDate);
      cursor.setHours(10, 0, 0, 0); 
      const closeTime = new Date(selectedDate);
      closeTime.setHours(20, 0, 0, 0);

      while (cursor < closeTime) {
        const slotStart = cursor;
        const slotEnd = addMinutes(cursor, 60); // Bloques de 60 mins

        // Verificar choque
        const isBusy = bookings?.some(b => {
          const bStart = new Date(b.start_at);
          const bEnd = new Date(b.end_at);
          return (slotStart < bEnd && slotEnd > bStart);
        });

        // No mostrar horas pasadas si es hoy
        const isPast = isToday(selectedDate) && slotStart < new Date();

        if (!isBusy && !isPast) {
          slots.push(format(slotStart, "HH:mm"));
        }
        cursor = addMinutes(cursor, 30); // Intervalos de 30 mins
      }
      setAvailableSlots(slots);
      setLoadingHours(false);
    };

    fetchAvailability();
  }, [selectedDate, selectedRoom]); // Se ejecuta si cambia la fecha O la sala

  // 4. GUARDAR RESERVA EN BD
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
        
        // 1. DÓNDE (Sala)
        room_id: selectedRoom.id,
        
        // 2. DE QUIÉN (Organización) - ¡CRUCIAL PARA SAAS! 🛡️
        org_id: selectedRoom.org_id, 

        // 3. QUÉ (Servicio y Color) - ¡CRUCIAL PARA EL CALENDARIO! 🎨
        service_id: defaultService?.id, 
        color: "#3b82f6", 

        // 4. OTROS DATOS
        payment_status: "pending",
        notes: `Reserva Web - WhatsApp: ${clientPhone} - Email: ${clientEmail}`
      });

      if (error) throw error;
      setStep(4); // Ir a pantalla de éxito
    } catch (error) {
      console.error(error);
      alert("Error al guardar. Intenta de nuevo.");
    } finally {
      setIsBooking(false);
    }
  };

  // --- RENDERIZADO ---
  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: step === 4 ? "1fr" : "300px 1fr", background: CARD_BG, borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", overflow: "hidden", maxWidth: 950, width: "100%", minHeight: 550 }}>

        {/* --- PANTALLA FINAL: ÉXITO --- */}
        {step === 4 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 70, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 32, marginBottom: 10 }}>¡Reserva Confirmada!</h2>
            <p style={{ color: TEXT_MUTED, maxWidth: 400, marginBottom: 30, lineHeight: 1.5 }}>
              Listo <b>{clientName}</b>. Tu sesión en <b>{selectedRoom?.name}</b> ha quedado agendada para el <b>{format(selectedDate!, "d 'de' MMMM", { locale: es })}</b> a las <b>{selectedTime}</b>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => window.location.reload()}
                style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}
              >
                Volver al inicio
              </button>
              <a 
                href={`https://wa.me/?text=Hola, he reservado hora para el ${format(selectedDate!, "dd/MM")} a las ${selectedTime}`}
                target="_blank"
                style={{ padding: "12px 24px", borderRadius: 12, background: "#22c55e", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
              >
                📲 Avisar por WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* --- COLUMNA IZQUIERDA (RESUMEN) --- */}
            <div style={{ padding: 30, borderRight: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #ea580c)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💈</div>
              <h2 style={{ color: TEXT_MAIN, margin: "0 0 5px 0", fontSize: 20 }}>Turno Aquí</h2>
              <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>Agenda profesional</p>
              
              <div style={{ marginTop: 40, flex: 1 }}>
                {/* Paso 1: Sala */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>ESPACIO SELECCIONADO</div>
                  <div style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: 600 }}>{selectedRoom ? selectedRoom.name : "Cargando..."}</div>
                </div>

                {/* Paso 2: Fecha */}
                {selectedDate && (
                   <div style={{ marginBottom: 20 }}>
                     <div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>FECHA</div>
                     <div style={{ color: TEXT_MAIN, fontSize: 16 }}>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</div>
                   </div>
                )}

                {/* Paso 3: Hora */}
                {selectedTime && (
                   <div>
                     <div style={{ fontSize: 11, fontWeight: 900, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 5 }}>HORA</div>
                     <div style={{ color: ACCENT, fontSize: 24, fontWeight: "bold" }}>{selectedTime}</div>
                   </div>
                )}
              </div>
            </div>

            {/* --- COLUMNA DERECHA (CONTENIDO DINÁMICO) --- */}
            <div style={{ padding: 30 }}>
              
              {/* VISTA 1: SELECCIÓN DE RECURSO Y FECHA (Combinadas para agilidad) */}
              {step === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 30 }}>
                  
                  {/* Lado A: Selector Sala y Calendario */}
                  <div>
                    {/* Selector de Sala / Profesional */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", color: TEXT_MUTED, fontSize: 12, marginBottom: 8 }}>¿Dónde quieres agendar?</label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {rooms.map(room => (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: `1px solid ${selectedRoom?.id === room.id ? ACCENT : BORDER}`,
                              background: selectedRoom?.id === room.id ? "rgba(59, 130, 246, 0.1)" : "transparent",
                              color: selectedRoom?.id === room.id ? ACCENT : TEXT_MUTED,
                              cursor: "pointer",
                              fontSize: 13, fontWeight: 600
                            }}
                          >
                            {room.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calendario */}
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
                        return (
                          <button
                            key={i}
                            onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                            disabled={!isCurrentMonth}
                            style={{
                              aspectRatio: "1/1", borderRadius: 8, border: "none",
                              background: isSelected ? ACCENT : isToday(day) ? "rgba(255,255,255,0.05)" : "transparent",
                              color: isSelected ? "white" : isCurrentMonth ? TEXT_MAIN : "#333",
                              cursor: isCurrentMonth ? "pointer" : "default", fontWeight: isSelected ? "bold" : "normal", fontSize: 13
                            }}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lado B: Lista de Horas */}
                  <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 20 }}>
                     <div style={{ color: TEXT_MAIN, fontSize: 14, marginBottom: 15, fontWeight: 600 }}>Horarios</div>
                     
                     {loadingHours ? (
                       <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Buscando espacios...</div>
                     ) : availableSlots.length > 0 ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: 8, height: 350, overflowY: "auto", paddingRight: 5 }}>
                         {availableSlots.map(time => (
                           <button
                             key={time}
                             onClick={() => setSelectedTime(time)}
                             style={{
                               padding: "10px", borderRadius: 8,
                               border: `1px solid ${selectedTime === time ? ACCENT : BORDER}`,
                               background: selectedTime === time ? ACCENT : "rgba(255,255,255,0.03)",
                               color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, textAlign: "center"
                             }}
                           >
                             {time}
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div style={{ color: TEXT_MUTED, fontSize: 12, fontStyle: "italic" }}>No hay horas libres para este día en esta sala.</div>
                     )}

                     {selectedTime && (
                       <button 
                         onClick={() => setStep(2)}
                         style={{ width: "100%", marginTop: 20, padding: 12, borderRadius: 8, background: "white", color: "black", fontWeight: 900, border: "none", cursor: "pointer" }}
                       >
                         Continuar →
                       </button>
                     )}
                  </div>
                </div>
              )}

              {/* VISTA 2: DATOS CLIENTE */}
              {step === 2 && (
                <div style={{ maxWidth: 400, margin: "0 auto", color: "white" }}>
                  <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", marginBottom: 20, fontSize: 14 }}>← Volver a elegir hora</button>
                  <h3 style={{ margin: "0 0 25px 0", fontSize: 24 }}>Casi listo...</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>Tu Nombre</label>
                       <input 
                         type="text" 
                         value={clientName}
                         onChange={e => setClientName(e.target.value)}
                         placeholder="Ej: Cristóbal Vergara" 
                         style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} 
                       />
                    </div>
                    <div>
                       <label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>WhatsApp (para confirmarte)</label>
                       <input 
                         type="tel" 
                         value={clientPhone}
                         onChange={e => setClientPhone(e.target.value)}
                         placeholder="+569..." 
                         style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} 
                       />
                    </div>
                    <div>
                       <label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 8 }}>Email (opcional)</label>
                       <input 
                         type="email" 
                         value={clientEmail}
                         onChange={e => setClientEmail(e.target.value)}
                         placeholder="correo@ejemplo.com" 
                         style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16 }} 
                       />
                    </div>
                    
                    <button 
                      onClick={handleBooking}
                      disabled={isBooking}
                      style={{ marginTop: 10, padding: 16, borderRadius: 12, background: ACCENT, color: "white", fontWeight: 900, border: "none", cursor: isBooking ? "wait" : "pointer", fontSize: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}
                    >
                      {isBooking ? "Guardando..." : "✅ Confirmar Reserva"}
                    </button>
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