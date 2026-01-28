"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
// ✅ Importamos todo lo necesario para fechas
import { format, addDays, startOfWeek, endOfMonth, startOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, addMinutes, isToday } from "date-fns";
import { es } from "date-fns/locale";
// ✅ Iconos para la UI
import { Upload, CheckCircle2, Loader2, Music, Calendar, Clock, MapPin, ChevronRight, User, Phone, ArrowLeft, Mic2, Users } from "lucide-react";
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
  
  // --- ESTADOS DE DATOS ---
  const [rooms, setRooms] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  // --- SELECCIONES ---
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // --- DATOS CLIENTE ---
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- UI & LOGICA ---
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 1. CARGA INICIAL DE DATOS (Salas, Servicios, Staff)
  useEffect(() => {
    const fetchAllData = async () => {
      // Cargar Salas
      const { data: roomsData } = await supabase.from("rooms").select("*").order("name");
      if (roomsData && roomsData.length > 0) {
        setRooms(roomsData);
        setSelectedRoom(roomsData[0]); // Seleccionar primera sala por defecto
      }

      // Cargar Servicios
      const { data: servicesData } = await supabase.from("services").select("*").order("price");
      if (servicesData && servicesData.length > 0) {
        setServices(servicesData);
        setSelectedService(servicesData[0]); // Seleccionar servicio más barato por defecto
      }

      // Cargar Staff
      const { data: staffData } = await supabase.from("staff").select("*");
      if (staffData) {
        setStaffMembers(staffData);
        // No seleccionamos staff por defecto para obligar al usuario a ver las opciones, o puedes poner el primero
        if(staffData.length > 0) setSelectedStaff(staffData[0]);
      }
    };
    fetchAllData();
  }, []);

  // 2. SUBIR ARCHIVO (MAQUETA)
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
      alert("Error al subir archivo.");
    } finally {
      setUploading(false);
    }
  };

  // 3. CALCULAR HORAS DISPONIBLES (La Lógica Maestra)
  useEffect(() => {
    if (!selectedDate || !selectedRoom) return;

    const fetchAvailability = async () => {
      setLoadingHours(true);
      const startOfSelected = startOfDay(selectedDate);
      const endOfSelected = new Date(selectedDate);
      endOfSelected.setHours(23, 59, 59, 999);

      // A. Buscamos reservas que choquen con la SALA
      const { data: roomBookings } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("room_id", selectedRoom.id) // Ocupan la misma sala
        .gte("start_at", startOfSelected.toISOString())
        .lte("start_at", endOfSelected.toISOString());

      // B. Si hay un staff seleccionado, buscamos si ÉL está ocupado (en cualquier sala)
      let staffBookings: any[] = [];
      if (selectedStaff) {
        const { data: sBookings } = await supabase
          .from("bookings")
          .select("start_at, end_at")
          .eq("staff_id", selectedStaff.id) // El staff está ocupado
          .gte("start_at", startOfSelected.toISOString())
          .lte("start_at", endOfSelected.toISOString());
        
        if (sBookings) staffBookings = sBookings;
      }

      // Combinamos las reservas que bloquean (Sala Ocupada O Staff Ocupado)
      const allBlockingBookings = [...(roomBookings || []), ...staffBookings];

      const slots = [];
      const now = new Date();
      let cursor = new Date(selectedDate);
      cursor.setHours(10, 0, 0, 0); // Abre a las 10:00 AM
      const closeTime = new Date(selectedDate);
      closeTime.setHours(22, 0, 0, 0); // Cierra a las 10:00 PM

      // Duración del servicio (si no tiene, asumimos 1 hora)
      // Nota: Si tu tabla services tiene columna 'duration', úsala aquí. 
      // Por ahora asumimos bloques de 1 hora fijos.
      const serviceDurationMinutes = 60; 

      while (cursor < closeTime) {
        const slotStart = new Date(cursor);
        const slotEnd = addMinutes(slotStart, serviceDurationMinutes);
        
        // Regla: No reservar en el pasado (+1 hora margen)
        const isPastTime = isBefore(slotStart, addMinutes(now, 60));

        // Verificamos colisión
        const isBusy = allBlockingBookings.some(b => {
          const bStart = new Date(b.start_at);
          const bEnd = new Date(b.end_at);
          // Fórmula de colisión de rangos: (StartA < EndB) y (EndA > StartB)
          return (slotStart < bEnd && slotEnd > bStart);
        });

        if (!isBusy && !isPastTime) {
          slots.push(format(slotStart, "HH:mm"));
        }
        // Avanzamos cada 60 mins (o 30 si quieres más granularidad)
        cursor = addMinutes(cursor, 60); 
      }
      setAvailableSlots(slots);
      setLoadingHours(false);
    };
    fetchAvailability();
  }, [selectedDate, selectedRoom, selectedStaff]); // Se recalcula si cambias fecha, sala o STAFF

  // 4. GUARDAR RESERVA
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
      const endAt = addMinutes(startAt, 60); // O la duración del servicio

      const { error } = await supabase.from("bookings").insert({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        client_name: clientName,
        client_phone: clientPhone,
        
        // GUARDAMOS TODA LA DATA IMPORTANTE
        room_id: selectedRoom.id,
        service_id: selectedService?.id,
        staff_id: selectedStaff?.id || null, // Guardamos al profesional
        org_id: selectedRoom.org_id, 
        
        color: "#10b981", 
        payment_status: "pending",
        reference_url: referenceUrl,
        notes: `Servicio: ${selectedService?.name}. Staff: ${selectedStaff?.full_name || 'Cualquiera'}`
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
      <div className="w-full max-w-6xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[600px] relative z-10">
        
        {step === 4 ? (
            // PANTALLA DE ÉXITO
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">¡Reserva Confirmada!</h2>
              <p className="text-zinc-400 max-w-md mb-8">
                Tu sesión de <b>{selectedService?.name}</b> ha sido agendada con éxito.
              </p>
              <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors">
                Hacer otra reserva
              </button>
            </div>
        ) : (
          <>
            {/* 👈 COLUMNA IZQUIERDA: RESUMEN (TICKET) */}
            <div className="bg-[#0A0A0B]/80 p-6 md:p-8 border-r border-white/5 flex flex-col relative">
               <div className="mb-6">
                  <Logo size="text-2xl" />
                  <p className="text-xs text-zinc-500 mt-2 font-medium tracking-wide">RESERVA ONLINE</p>
               </div>

               <div className="flex-1 space-y-5">
                  {/* Servicio */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <Mic2 className="w-3 h-3" /> Servicio
                    </label>
                    <div className="text-lg font-medium text-white">
                      {selectedService?.name || "Seleccionando..."}
                    </div>
                  </div>

                  {/* Profesional */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Profesional
                    </label>
                    <div className="text-lg font-medium text-emerald-400">
                      {selectedStaff?.full_name || "Cualquiera disponible"}
                    </div>
                  </div>

                  {/* Sala */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Sala
                    </label>
                    <div className="text-base text-zinc-300">
                      {selectedRoom?.name || "---"}
                    </div>
                  </div>

                  {/* Fecha y Hora */}
                  <div className={`transition-all duration-300 ${selectedTime ? 'opacity-100' : 'opacity-40'}`}>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Fecha y Hora
                    </label>
                    <div className="text-base text-white capitalize">
                      {selectedDate ? format(selectedDate, "EEE d MMM", { locale: es }) : "---"} 
                      {selectedTime && ` a las ${selectedTime}`}
                    </div>
                  </div>
               </div>

               {/* Precio Total */}
               <div className="mt-auto pt-6 border-t border-white/5">
                 <div className="flex justify-between items-end">
                   <span className="text-xs text-zinc-500">Total a Pagar</span>
                   <span className="text-2xl font-bold text-white">${selectedService?.price?.toLocaleString() || "0"}</span>
                 </div>
               </div>
            </div>

            {/* 👉 COLUMNA DERECHA: SELECCIÓN */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[800px] custom-scrollbar">
              
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  
                  {/* 1. SELECCIÓN DE SERVICIOS (Chips) */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">1. ¿Qué necesitas?</h3>
                    <div className="flex flex-wrap gap-2">
                      {services.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            selectedService?.id === s.id
                              ? "bg-white text-black border-white shadow-lg shadow-white/10"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {s.name} <span className="opacity-50 ml-1 text-xs">${(s.price/1000)}k</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. SELECCIÓN DE STAFF (Avatares) */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">2. ¿Con quién?</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {staffMembers.map(member => (
                         <button
                           key={member.id}
                           onClick={() => setSelectedStaff(member)}
                           className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                             selectedStaff?.id === member.id
                               ? "bg-emerald-500/10 border-emerald-500/50"
                               : "bg-zinc-900 border-white/5 hover:border-white/20"
                           }`}
                         >
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              selectedStaff?.id === member.id ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400"
                           }`}>
                             {member.full_name?.charAt(0)}
                           </div>
                           <div>
                             <div className={`text-xs font-bold ${selectedStaff?.id === member.id ? "text-emerald-400" : "text-zinc-300"}`}>
                               {member.full_name}
                             </div>
                             <div className="text-[10px] text-zinc-500 capitalize">{member.role || 'Productor'}</div>
                           </div>
                         </button>
                       ))}
                    </div>
                  </div>

                   {/* 3. SELECCIÓN DE SALA (Pestañas) */}
                   <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">3. ¿Dónde?</h3>
                    <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-fit">
                        {rooms.map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => setSelectedRoom(r)} 
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedRoom?.id === r.id 
                                ? "bg-zinc-800 text-white shadow-sm" 
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {r.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* 4. CALENDARIO Y HORAS */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6">
                    {/* Calendario */}
                    <div>
                      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
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
                                aspectRatio-square h-9 w-full rounded-lg flex items-center justify-center text-xs font-medium transition-all relative
                                ${isSelected 
                                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-bold scale-110 z-10" 
                                  : isPast 
                                    ? "text-zinc-800 cursor-not-allowed" 
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white bg-white/5"
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
                    <div className="border-l border-white/5 pl-6 lg:h-[300px] overflow-y-auto custom-scrollbar">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 sticky top-0 bg-[#0F1112]/90 backdrop-blur py-2">
                        Horarios Libres
                      </h4>
                      {loadingHours ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500 w-5 h-5" /></div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {availableSlots.map(t => (
                            <button 
                              key={t} 
                              onClick={() => setSelectedTime(t)} 
                              className={`
                                w-full py-2 px-3 rounded-lg text-xs font-medium transition-all border
                                ${selectedTime === t 
                                  ? "bg-emerald-500 text-black border-emerald-500 font-bold" 
                                  : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/20"
                                }
                              `}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 text-center py-10 italic">Sin cupos.</p>
                      )}
                    </div>
                  </div>

                  {selectedTime && (
                    <button 
                      onClick={() => setStep(2)} 
                      className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 hover:text-black transition-all shadow-xl text-sm uppercase tracking-wide"
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
                     <ArrowLeft className="w-3 h-3" /> Volver a configuración
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
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm" 
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
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm" 
                          />
                        </div>
                      </div>

                      {/* Upload Maqueta */}
                      <div className="pt-4">
                         <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 mb-2">Maqueta o Referencia (Opcional)</label>
                         <label className={`
                            flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                            ${referenceUrl 
                               ? "border-emerald-500/50 bg-emerald-500/5" 
                               : "border-zinc-700 bg-black/20 hover:border-zinc-500 hover:bg-white/5"
                            }
                         `}>
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            ) : referenceUrl ? (
                                <div className="text-center">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                                    <span className="text-xs font-bold text-emerald-400">¡Archivo subido!</span>
                                </div>
                            ) : (
                                <div className="text-center px-4">
                                    <Music className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                                    <span className="text-[10px] text-zinc-400">Subir MP3/WAV</span>
                                </div>
                            )}
                            <input type="file" onChange={handleFileUpload} accept="audio/*" className="hidden" />
                         </label>
                      </div>
                   </div>

                   <button 
                     onClick={handleBooking} 
                     disabled={isBooking || uploading} 
                     className="w-full mt-8 py-4 rounded-xl bg-emerald-500 text-black font-bold text-sm uppercase tracking-wide hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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