"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
// ✅ CORRECCIÓN: Agregué "isToday" a los imports
import { format, addDays, startOfWeek, endOfMonth, startOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, addMinutes, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Upload, CheckCircle2, Loader2, Music, Calendar, Clock, MapPin, ChevronRight, User, Phone, ArrowLeft } from "lucide-react";
import { Outfit } from "next/font/google";
import { Logo } from "@/components/ui/Logo";

const outfit = Outfit({ subsets: ["latin"] });

// --- CONFIGURACIÓN SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [defaultService, setDefaultService] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Datos Cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 1. Cargar Salas
  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData } = await supabase.from("rooms").select("*").order("name");
      if (roomsData && roomsData.length > 0) {
        setRooms(roomsData);
        setSelectedRoom(roomsData[0]);
      }
      const { data: servicesData } = await supabase.from("services").select("*").limit(1);
      if (servicesData && servicesData.length > 0) {
        setDefaultService(servicesData[0]);
      }
    };
    fetchData();
  }, []);

  // 2. Subir Archivo (Maqueta)
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
      alert("Error al subir archivo. Verifica tu bucket en Supabase.");
    } finally {
      setUploading(false);
    }
  };

  // 3. Calcular Horas Disponibles
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
      cursor.setHours(10, 0, 0, 0); // Abre a las 10:00
      const closeTime = new Date(selectedDate);
      closeTime.setHours(22, 0, 0, 0); // Cierra a las 22:00

      while (cursor < closeTime) {
        const slotStart = new Date(cursor);
        // Regla: No se puede reservar en el pasado + 1 hora de margen
        const isPastTime = isBefore(slotStart, addMinutes(now, 60));

        const isBusy = bookings?.some(b => {
          const bStart = new Date(b.start_at);
          const bEnd = new Date(b.end_at);
          return (slotStart < bEnd && addMinutes(slotStart, 60) > bStart);
        });

        if (!isBusy && !isPastTime) {
          slots.push(format(slotStart, "HH:mm"));
        }
        cursor = addMinutes(cursor, 60); // Bloques de 1 hora
      }
      setAvailableSlots(slots);
      setLoadingHours(false);
    };
    fetchAvailability();
  }, [selectedDate, selectedRoom]);

  // 4. Guardar Reserva
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
        client_phone: clientPhone,
        room_id: selectedRoom.id,
        org_id: selectedRoom.org_id, 
        service_id: defaultService?.id, 
        color: "#10b981", // Emerald Green
        payment_status: "pending",
        reference_url: referenceUrl,
        notes: `Reserva Web. Ref: ${referenceUrl ? 'Sí' : 'No'}`
      });
      if (error) throw error;
      setStep(4); // Pantalla de éxito
    } catch (error) {
      console.error(error);
      alert("Error al guardar reserva.");
    } finally {
      setIsBooking(false);
    }
  };

  // Calendario UI
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 flex items-center justify-center p-4 md:p-8 ${outfit.className} relative overflow-hidden`}>
      
      {/* Fondo Ambiental */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* TARJETA PRINCIPAL */}
      <div className="w-full max-w-5xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[350px_1fr] min-h-[600px] relative z-10">
        
        {step === 4 ? (
            // PANTALLA DE ÉXITO
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">¡Reserva Confirmada!</h2>
              <p className="text-zinc-400 max-w-md mb-8">
                Tu sesión en <b>{selectedRoom?.name}</b> ha sido agendada. Nos pondremos en contacto contigo pronto.
              </p>
              <div className="bg-black/30 p-6 rounded-2xl border border-white/10 w-full max-w-sm mb-8 text-left">
                 <div className="flex justify-between mb-2">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Fecha</span>
                    <span className="text-sm font-medium">{format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Hora</span>
                    <span className="text-sm font-medium text-emerald-400">{selectedTime}</span>
                 </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors">
                Hacer otra reserva
              </button>
            </div>
        ) : (
          <>
            {/* 👈 COLUMNA IZQUIERDA: RESUMEN (TICKET) */}
            <div className="bg-[#0A0A0B]/80 p-8 border-r border-white/5 flex flex-col relative overflow-hidden">
               {/* Decoración Ticket */}
               <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#0F1112] rounded-full border border-white/5" />
               
               <div className="mb-8">
                  <Logo size="text-2xl" />
                  <p className="text-xs text-zinc-500 mt-2 font-medium tracking-wide">RESERVA TU SESIÓN</p>
               </div>

               <div className="flex-1 space-y-6">
                  {/* Sala */}
                  <div className="group">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Sala Seleccionada
                    </label>
                    <div className="text-xl font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {selectedRoom?.name || "Cargando..."}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className={`transition-all duration-500 ${selectedDate ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Fecha
                    </label>
                    <div className="text-lg text-zinc-300 capitalize">
                      {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "---"}
                    </div>
                  </div>

                  {/* Hora */}
                  <div className={`transition-all duration-500 delay-100 ${selectedTime ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Hora
                    </label>
                    <div className="text-3xl font-light text-emerald-400">
                      {selectedTime || "--:--"}
                    </div>
                  </div>
               </div>

               {/* Precio Referencial */}
               <div className="mt-auto pt-6 border-t border-white/5">
                 <div className="flex justify-between items-end">
                   <span className="text-xs text-zinc-500">Total Estimado</span>
                   <span className="text-xl font-bold text-white">${defaultService?.price?.toLocaleString() || "---"}</span>
                 </div>
               </div>
            </div>

            {/* 👉 COLUMNA DERECHA: SELECCIÓN */}
            <div className="p-8 overflow-y-auto max-h-[800px]">
              
              {/* PASO 1: FECHA Y HORA */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Selecciona horario</h3>
                    <div className="flex gap-2">
                        {rooms.map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => setSelectedRoom(r)} 
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              selectedRoom?.id === r.id 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                : "bg-transparent border-white/10 text-zinc-500 hover:border-white/30"
                            }`}
                          >
                            {r.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8">
                    {/* Calendario */}
                    <div>
                      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {["L","M","M","J","V","S","D"].map(d => (
                          <span key={d} className="text-[10px] font-bold text-zinc-600">{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, i) => {
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                          return (
                            <button 
                              key={i} 
                              onClick={() => !isPast && setSelectedDate(day)} 
                              disabled={isPast} 
                              className={`
                                aspectRatio-square h-10 w-full rounded-xl flex items-center justify-center text-sm font-medium transition-all relative
                                ${isSelected 
                                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-bold scale-110 z-10" 
                                  : isPast 
                                    ? "text-zinc-800 cursor-not-allowed" 
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                }
                              `}
                            >
                              {format(day, "d")}
                              {isToday(day) && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Horas */}
                    <div className="border-l border-white/5 pl-8 lg:h-[350px] overflow-y-auto custom-scrollbar">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 sticky top-0 bg-[#0F1112] py-2">
                        Disponibilidad
                      </h4>
                      {loadingHours ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div>
                      ) : availableSlots.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {availableSlots.map(t => (
                            <button 
                              key={t} 
                              onClick={() => setSelectedTime(t)} 
                              className={`
                                w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all border
                                ${selectedTime === t 
                                  ? "bg-emerald-500 text-black border-emerald-500 font-bold shadow-lg shadow-emerald-500/20" 
                                  : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/20"
                                }
                              `}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 text-center py-10">No hay horas disponibles.</p>
                      )}
                    </div>
                  </div>

                  {selectedTime && (
                    <button 
                      onClick={() => setStep(2)} 
                      className="w-full mt-8 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl"
                    >
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* PASO 2: DATOS DEL CLIENTE */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto">
                   <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mb-6 transition-colors">
                     <ArrowLeft className="w-3 h-3" /> Volver a horarios
                   </button>
                   
                   <h3 className="text-2xl font-bold text-white mb-6">Tus Datos</h3>
                   
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nombre Completo</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" />
                          <input 
                            type="text" 
                            value={clientName} 
                            onChange={e => setClientName(e.target.value)} 
                            placeholder="Ej: Juan Pérez" 
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Teléfono (WhatsApp)</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-3.5 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" />
                          <input 
                            type="tel" 
                            value={clientPhone} 
                            onChange={e => setClientPhone(e.target.value)} 
                            placeholder="+56 9 1234 5678" 
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                          />
                        </div>
                      </div>

                      {/* Upload Maqueta */}
                      <div className="pt-4">
                         <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 mb-2">Maqueta o Referencia (Opcional)</label>
                         <label className={`
                            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                            ${referenceUrl 
                               ? "border-emerald-500/50 bg-emerald-500/5" 
                               : "border-zinc-700 bg-black/20 hover:border-zinc-500 hover:bg-white/5"
                            }
                         `}>
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            ) : referenceUrl ? (
                                <div className="text-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <span className="text-xs font-bold text-emerald-400">¡Archivo subido!</span>
                                </div>
                            ) : (
                                <div className="text-center px-4">
                                    <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                    <span className="text-xs text-zinc-400">Click para subir MP3/WAV</span>
                                </div>
                            )}
                            <input type="file" onChange={handleFileUpload} accept="audio/*" className="hidden" />
                         </label>
                      </div>
                   </div>

                   <button 
                     onClick={handleBooking} 
                     disabled={isBooking || uploading} 
                     className="w-full mt-8 py-4 rounded-xl bg-emerald-500 text-black font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
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