"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, addDays, startOfWeek, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMinutes, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Upload, CheckCircle2, Loader2, Music } from "lucide-react";

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
  
  // Formulario y Archivo
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Lógica para subir el archivo al Bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('session-files').getPublicUrl(fileName);
      setReferenceUrl(data.publicUrl);

    } catch (error) {
      console.error(error);
      alert("Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

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
        const isPastTime = isBefore(slotStart, addMinutes(now, 15));

        const isBusy = bookings?.some(b => {
          const bStart = new Date(b.start_at);
          const bEnd = new Date(b.end_at);
          return (slotStart < bEnd && addMinutes(slotStart, 60) > bStart);
        });

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
        reference_url: referenceUrl, // 🎙️ Guardamos el link de la maqueta
        notes: `WhatsApp: ${clientPhone}. Referencia: ${referenceUrl ? 'Adjunta' : 'Ninguna'}`
      });
      if (error) throw error;
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Error al guardar reserva.");
    } finally {
      setIsBooking(false);
    }
  };

  // Fragmento del calendario y lógica de renderizado...
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: step === 4 ? "1fr" : "300px 1fr", background: CARD_BG, borderRadius: 24, border: `1px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", overflow: "hidden", maxWidth: 950, width: "100%", minHeight: 550 }}>
        
        {step === 4 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", color: "white" }}>
              <div style={{ fontSize: 70, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontSize: 32, marginBottom: 10 }}>¡Reserva Confirmada!</h2>
              <p style={{ color: TEXT_MUTED, maxWidth: 400, marginBottom: 30 }}>Tu sesión en <b>{selectedRoom?.name}</b> está lista.</p>
              <button onClick={() => window.location.reload()} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}>Cerrar</button>
            </div>
        ) : (
          <>
            {/* COLUMNA IZQUIERDA */}
            <div style={{ padding: 30, borderRight: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", color: "white" }}>
              <div style={{ fontSize: 24, marginBottom: 20 }}>🎙️</div>
              <h2 style={{ fontSize: 20, marginBottom: 5 }}>StudioManager</h2>
              <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Reserva tu sesión profesional</p>
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 5 }}>SALA</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>{selectedRoom?.name || '---'}</div>
                {selectedDate && <div style={{ fontSize: 16, marginBottom: 20 }}>{format(selectedDate, "PPP", { locale: es })}</div>}
                {selectedTime && <div style={{ fontSize: 24, fontWeight: "bold", color: ACCENT }}>{selectedTime}</div>}
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div style={{ padding: 30 }}>
              {step === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 30 }}>
                  <div>
                    {/* Selector Salas y Calendario */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {rooms.map(r => (
                        <button key={r.id} onClick={() => setSelectedRoom(r)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${selectedRoom?.id === r.id ? ACCENT : BORDER}`, background: selectedRoom?.id === r.id ? "rgba(59,130,246,0.1)" : "transparent", color: selectedRoom?.id === r.id ? ACCENT : TEXT_MUTED, cursor: "pointer", fontSize: 12 }}>{r.name}</button>
                      ))}
                    </div>
                    {/* Grid de días */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
                      {calendarDays.map((day, i) => {
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                        return (
                          <button key={i} onClick={() => !isPast && setSelectedDate(day)} disabled={isPast} style={{ aspectRatio: "1/1", borderRadius: 8, border: "none", background: isSelected ? ACCENT : "transparent", color: isPast ? "#333" : "white", cursor: isPast ? "default" : "pointer", opacity: isPast ? 0.3 : 1 }}>{format(day, "d")}</button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Horas */}
                  <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: 350, overflowY: "auto" }}>
                      {availableSlots.map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)} style={{ padding: "10px", borderRadius: 8, border: `1px solid ${selectedTime === t ? ACCENT : BORDER}`, background: selectedTime === t ? ACCENT : "transparent", color: "white", cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                    {selectedTime && <button onClick={() => setStep(2)} style={{ width: "100%", marginTop: 20, padding: 12, borderRadius: 8, background: "white", color: "black", fontWeight: "bold", border: "none", cursor: "pointer" }}>Siguiente</button>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ maxWidth: 400, margin: "0 auto" }}>
                  <h3 style={{ color: "white", fontSize: 24, marginBottom: 20 }}>Tus datos</h3>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre completo" style={{ width: "100%", padding: 12, borderRadius: 10, background: "#000", border: `1px solid ${BORDER}`, color: "white", marginBottom: 15 }} />
                  <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="WhatsApp" style={{ width: "100%", padding: 12, borderRadius: 10, background: "#000", border: `1px solid ${BORDER}`, color: "white", marginBottom: 15 }} />
                  
                  {/* 🎙️ CARGADOR DE AUDIO FIRST */}
                  <div style={{ padding: 20, border: `2px dashed ${referenceUrl ? ACCENT : BORDER}`, borderRadius: 12, textAlign: "center", marginBottom: 20, background: "rgba(255,255,255,0.02)" }}>
                    {uploading ? <Loader2 style={{ margin: "0 auto" }} className="animate-spin text-white" /> : 
                     referenceUrl ? <div style={{ color: ACCENT }}><CheckCircle2 style={{ margin: "0 auto 10px" }} /> <span style={{ fontSize: 12 }}>¡Maqueta cargada!</span></div> :
                     <label style={{ cursor: "pointer" }}>
                        <Upload style={{ margin: "0 auto 10px", color: TEXT_MUTED }} />
                        <div style={{ fontSize: 12, color: TEXT_MUTED }}>Sube tu maqueta o referencia (MP3/WAV)</div>
                        <input type="file" onChange={handleFileUpload} style={{ display: "none" }} accept="audio/*" />
                     </label>
                    }
                  </div>

                  <button onClick={handleBooking} disabled={isBooking || uploading} style={{ width: "100%", padding: 16, borderRadius: 12, background: ACCENT, color: "white", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                    {isBooking ? "Confirmando..." : "Finalizar Reserva"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}