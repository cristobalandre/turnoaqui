'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
// Componentes UI (con clases inyectadas para forzar modo oscuro)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// Iconos y Utilidades
import { ChevronLeft, ChevronRight, Plus, Pencil, X, Calendar, Filter, Clock } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const timezone = 'America/Santiago'

// --- INTERFACES EN INGLÉS (Actualizadas) ---
interface Room {
  id: string
  name: string
}

interface Producer { // Antes Productor
  id: string
  name: string
}

interface Artist { // Antes Artista
  id: string
  name: string
}

interface Booking { // Antes Sesion
  id: string
  room_id: string
  producer_id: string // Antes productor_id
  artist_id: string   // Antes artista_id
  starts_at: string   // Antes fecha_inicio
  ends_at: string     // Antes fecha_fin
  notes: string | null // Antes notas
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' // Antes estado
  rooms: { name: string }
  producers: { name: string } // Relación con tabla producers
  artists: { name: string }   // Relación con tabla artists
}

export default function AgendaPage() {
  // --- ESTADOS ---
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([]) // Antes sesiones
  const [rooms, setRooms] = useState<Room[]>([])
  const [producers, setProducers] = useState<Producer[]>([]) // Antes productores
  const [artists, setArtists] = useState<Artist[]>([]) // Antes artistas
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null) // Antes editingSesion
  
  const [filters, setFilters] = useState({
    room_id: '',
    producer_id: '',
    artist_id: '',
  })
  
  const [formData, setFormData] = useState({
    room_id: '',
    producer_id: '',
    artist_id: '',
    starts_at: '',
    ends_at: '',
    notes: '',
    status: 'scheduled' as const,
  })
  const [errors, setErrors] = useState<string[]>([])
  const supabase = createClient()

  // Configuración de Calendario (24 HORAS SOLICITADO - Intacto)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i) // 00:00 a 23:00

  // --- EFECTOS & DATA FETCHING ---
  useEffect(() => {
    fetchData()
  }, [currentWeek, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Tablas Maestras (En Inglés)
      const [roomsRes, producersRes, artistsRes] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('producers').select('*').order('name'), // Tabla producers
        supabase.from('artists').select('*').order('name'),   // Tabla artists
      ])

      if (roomsRes.error) throw roomsRes.error
      if (producersRes.error) throw producersRes.error
      if (artistsRes.error) throw artistsRes.error

      setRooms(roomsRes.data || [])
      setProducers(producersRes.data || [])
      setArtists(artistsRes.data || [])

      // 2. Fetch Agenda (Tabla bookings)
      const weekStartUTC = fromZonedTime(weekStart, timezone)
      const weekEnd = addDays(weekStart, 7)
      const weekEndUTC = fromZonedTime(weekEnd, timezone)

      let query = supabase
        .from('bookings') // Tabla bookings
        .select(`
          *,
          rooms(name),
          producers(name),
          artists(name)
        `)
        .gte('starts_at', weekStartUTC.toISOString())
        .lt('starts_at', weekEndUTC.toISOString())
        .order('starts_at', { ascending: true })

      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id)
      }
      if (filters.producer_id) {
        query = query.eq('producer_id', filters.producer_id)
      }
      if (filters.artist_id) {
        query = query.eq('artist_id', filters.artist_id)
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE CONFLICTOS (Adaptada a columnas en inglés) ---
  const checkConflicts = async (
    roomId: string,
    producerId: string,
    artistId: string,
    start: string,
    end: string,
    excludeId?: string
  ): Promise<string[]> => {
    const conflicts: string[] = []

    const checkOverlap = async (column: string, value: string, errorMsg: string) => {
        const { data } = await supabase
          .from('bookings') // Tabla bookings
          .select('*')
          .eq(column, value)
          .neq('status', 'cancelled')
          .or(`and(starts_at.lt.${end},ends_at.gt.${start})`) // Lógica de superposición

        if (data) {
          const hasConflict = data.some(
            (b: any) => b.id !== excludeId && b.status !== 'cancelled'
          )
          if (hasConflict) conflicts.push(errorMsg)
        }
    }

    await Promise.all([
        checkOverlap('room_id', roomId, 'La sala ya está ocupada en ese horario'),
        checkOverlap('producer_id', producerId, 'El productor ya tiene una sesión en ese horario'),
        checkOverlap('artist_id', artistId, 'El artista ya tiene una sesión en ese horario')
    ])

    return conflicts
  }

  // --- MANEJO DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const startUTC = fromZonedTime(
      parseISO(formData.starts_at),
      timezone
    ).toISOString()
    const endUTC = fromZonedTime(
      parseISO(formData.ends_at),
      timezone
    ).toISOString()

    // Validate dates
    if (new Date(endUTC) <= new Date(startUTC)) {
      setErrors(['La fecha de fin debe ser posterior a la fecha de inicio'])
      return
    }

    // Check conflicts
    const conflicts = await checkConflicts(
      formData.room_id,
      formData.producer_id,
      formData.artist_id,
      startUTC,
      endUTC,
      editingBooking?.id
    )

    if (conflicts.length > 0) {
      setErrors(conflicts)
      return
    }

    try {
      const data = {
        room_id: formData.room_id,
        producer_id: formData.producer_id,
        artist_id: formData.artist_id,
        starts_at: startUTC,
        ends_at: endUTC,
        notes: formData.notes || null,
        status: formData.status,
        // updated_at se suele manejar automático en Supabase, pero si lo necesitas:
        // updated_at: new Date().toISOString(),
      }

      if (editingBooking) {
        const { error } = await supabase
          .from('bookings')
          .update(data)
          .eq('id', editingBooking.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('bookings').insert([data])
        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving booking:', error)
      setErrors([error.message || 'Error al guardar la sesión'])
    }
  }

  // --- ACCIONES DE UI ---
  const handleEdit = (bk: Booking) => {
    // BLINDAJE: Si la fecha es inválida, no permitimos editar para evitar crash
    if (!bk.starts_at || !bk.ends_at) return;

    setEditingBooking(bk)
    const startLocal = toZonedTime(
      parseISO(bk.starts_at),
      timezone
    )
    const endLocal = toZonedTime(parseISO(bk.ends_at), timezone)

    setFormData({
      room_id: bk.room_id,
      producer_id: bk.producer_id,
      artist_id: bk.artist_id,
      starts_at: format(startLocal, "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(endLocal, "yyyy-MM-dd'T'HH:mm"),
      notes: bk.notes || '',
      status: bk.status as any,
    })
    setDialogOpen(true)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta sesión?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' }) // updated_at si es necesario
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('Error al cancelar la sesión')
    }
  }

  const resetForm = () => {
    setFormData({
      room_id: '',
      producer_id: '',
      artist_id: '',
      starts_at: '',
      ends_at: '',
      notes: '',
      status: 'scheduled',
    })
    setEditingBooking(null)
    setErrors([])
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // --- LÓGICA DE RENDERIZADO ---
  const getBookingsForSlot = (day: Date, hour: number) => {
    return bookings.filter((bk) => {
      // 🛡️ PROTECCIÓN ANTI-CRASH 🛡️
      if (!bk.starts_at || !bk.ends_at) return false;
      
      if (bk.status === 'cancelled') return false
      
      try {
        const start = toZonedTime(parseISO(bk.starts_at), timezone)
        const end = toZonedTime(parseISO(bk.ends_at), timezone)
        return (
            isSameDay(start, day) &&
            start.getHours() <= hour &&
            end.getHours() > hour
        )
      } catch (e) {
          return false; 
      }
    })
  }

  const getBookingStyle = (bk: Booking) => {
    if (!bk.starts_at || !bk.ends_at) return {};

    const start = toZonedTime(parseISO(bk.starts_at), timezone)
    const end = toZonedTime(parseISO(bk.ends_at), timezone)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const startHour = start.getHours() + start.getMinutes() / 60

    // COLORES ENTERPRISE (Mapeados a estados en Inglés)
    const colors: Record<string, string> = {
      scheduled: 'bg-emerald-500/20 border-emerald-500 text-emerald-100 hover:bg-emerald-500/30',
      active: 'bg-amber-500/20 border-amber-500 text-amber-100 hover:bg-amber-500/30 animate-pulse',
      completed: 'bg-zinc-800/80 border-zinc-600 text-zinc-400 grayscale',
      cancelled: 'hidden', 
    }
    // Fallback por seguridad
    const finalColor = colors[bk.status] || colors.scheduled

    return {
      top: `${(startHour % 1) * 60}px`,
      height: `${duration * 60}px`,
      className: `absolute left-0.5 right-0.5 border p-2 rounded-md text-[10px] leading-tight backdrop-blur-md transition-all z-10 cursor-pointer shadow-sm overflow-hidden ${finalColor}`
    }
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-emerald-500 font-mono text-sm animate-pulse tracking-widest">CARGANDO STUDIO HUB...</div>
  }

  return (
    <div className="h-full flex flex-col font-sans space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="text-emerald-500 w-8 h-8" /> Agenda Semanal
          </h2>
          <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold border-l-2 border-emerald-500 pl-3 ml-1">
            {format(weekStart, "d 'de' MMMM", { locale: es })} —{' '}
            {format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           {/* NAVEGACIÓN SEMANAS */}
           <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-inner">
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date())} className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold px-3 h-8">HOY</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
           </div>
           
           {/* MODAL DE CREACIÓN / EDICIÓN */}
           <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-white text-black hover:bg-emerald-400 hover:text-black font-bold rounded-xl text-xs gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all h-10 px-4">
                <Plus className="h-4 w-4" /> NUEVA SESIÓN
              </Button>
            </DialogTrigger>
            
            {/* CONTENIDO DEL MODAL (Estilo Oscuro) */}
            <DialogContent className="bg-[#0F1112] border-zinc-800 text-white sm:max-w-[600px] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                    {editingBooking ? <Pencil className="w-5 h-5 text-emerald-500"/> : <Plus className="w-5 h-5 text-emerald-500"/>}
                    {editingBooking ? 'Editar Sesión' : 'Agendar Nueva Sesión'}
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  {editingBooking ? 'Modifica los detalles del evento.' : 'Reserva un espacio en el estudio.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="room_id" className="text-xs font-bold text-zinc-400 uppercase">Sala</Label>
                      {/* Usamos select nativo */}
                      <select id="room_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })} required>
                        <option value="">Seleccionar sala...</option>
                        {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="status" className="text-xs font-bold text-zinc-400 uppercase">Estado</Label>
                      <select id="status" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="scheduled">📅 Programada</option>
                        <option value="active">🔴 En Curso</option>
                        <option value="completed">✅ Completada</option>
                        <option value="cancelled">❌ Cancelada</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="producer_id" className="text-xs font-bold text-zinc-400 uppercase">Productor</Label>
                      <select id="producer_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.producer_id} onChange={(e) => setFormData({ ...formData, producer_id: e.target.value })} required>
                        <option value="">Seleccionar...</option>
                        {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="artist_id" className="text-xs font-bold text-zinc-400 uppercase">Artista</Label>
                      <select id="artist_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.artist_id} onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })} required>
                        <option value="">Seleccionar...</option>
                        {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="starts_at" className="text-xs font-bold text-zinc-400 uppercase">Inicio</Label>
                      <Input id="starts_at" type="datetime-local" className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                        value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ends_at" className="text-xs font-bold text-zinc-400 uppercase">Fin</Label>
                      <Input id="ends_at" type="datetime-local" className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                        value={formData.ends_at} onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })} required />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-bold text-zinc-400 uppercase">Notas</Label>
                    <Textarea id="notes" className="bg-zinc-900 border-zinc-800 text-white resize-none focus:ring-emerald-500"
                      value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Detalles técnicos, requerimientos, etc..." />
                  </div>

                  {errors.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium space-y-1">
                      {errors.map((error, i) => <div key={i}>• {error}</div>)}
                    </div>
                  )}

                  <DialogFooter className="gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-500 hover:text-white hover:bg-zinc-800">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6">
                      {editingBooking ? 'Guardar Cambios' : 'Crear Sesión'}
                    </Button>
                  </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BARRA DE FILTROS (Estilo Enterprise) */}
      <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold uppercase tracking-widest pb-2 md:pb-0">
                <Filter className="w-4 h-4 text-emerald-500" />
                Filtros
             </div>
             <div>
                <Label htmlFor="filter_room" className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Por Sala</Label>
                <select id="filter_room" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 outline-none"
                    value={filters.room_id} onChange={(e) => setFilters({ ...filters, room_id: e.target.value })}>
                    <option value="">Todas las salas</option>
                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </div>
             <div>
                <Label htmlFor="filter_producer" className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Por Productor</Label>
                <select id="filter_producer" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 outline-none"
                    value={filters.producer_id} onChange={(e) => setFilters({ ...filters, producer_id: e.target.value })}>
                    <option value="">Todos los productores</option>
                    {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             <div>
                <Label htmlFor="filter_artist" className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Por Artista</Label>
                <select id="filter_artist" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 outline-none"
                    value={filters.artist_id} onChange={(e) => setFilters({ ...filters, artist_id: e.target.value })}>
                    <option value="">Todos los artistas</option>
                    {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* GRID DE CALENDARIO (Estilo Enterprise + 24 Horas) */}
      <div className="flex-1 overflow-hidden bg-zinc-900/30 border border-zinc-800/50 rounded-2xl shadow-2xl flex flex-col min-h-[600px]">
        {/* Cabecera de Días */}
        <div className="grid grid-cols-8 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
            {/* Esquina Hora */}
            <div className="p-3 text-center border-r border-zinc-800/50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-zinc-600" />
            </div>
            
            {/* Días de la semana */}
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`p-3 text-center border-r border-zinc-800/50 ${isToday ? 'bg-emerald-500/5 shadow-[inset_0_-2px_0_#10b981]' : ''}`}>
                  <div className={`text-sm font-bold ${isToday ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-[10px] font-bold uppercase mt-1 ${isToday ? 'text-emerald-600' : 'text-zinc-600'}`}>
                    {format(day, 'd MMM', { locale: es })}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Cuerpo del Calendario (Scrollable) */}
        <div className="overflow-y-auto flex-1 custom-scrollbar relative">
          <div className="min-w-[800px]"> {/* Asegura scroll horizontal en móviles */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[80px]"> {/* 80px altura mínima por hora */}
                
                {/* Columna Hora */}
                <div className="border-r border-b border-zinc-800/30 p-2 text-[10px] font-mono text-zinc-500 text-center pt-3 bg-zinc-900/20 sticky left-0 z-10">
                  {hour}:00
                </div>
                
                {/* Celdas de Días */}
                {weekDays.map((day) => {
                  const bookingsEnSlot = getBookingsForSlot(day, hour)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div key={`${day.toISOString()}-${hour}`} className={`relative border-r border-b border-zinc-800/30 transition-colors group ${isToday ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/20'}`}>
                      {/* Renderizado de Sesiones */}
                      {bookingsEnSlot.map((bk) => {
                        const style = getBookingStyle(bk)
                        return (
                          <div
                            key={bk.id}
                            className={style.className}
                            style={style as any}
                            onClick={() => handleEdit(bk)}
                            title={`${bk.rooms.name} - ${bk.producers.name} / ${bk.artists.name}`}
                          >
                            <div className="font-bold truncate text-[11px] mb-0.5 text-white shadow-black drop-shadow-md">
                              {bk.rooms.name}
                            </div>
                            <div className="truncate text-[9px] opacity-90 font-medium">
                              {bk.producers.name}
                            </div>
                            <div className="truncate text-[9px] opacity-75">
                              ft. {bk.artists.name}
                            </div>

                            {/* Acciones Rápidas (Hover) */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5 backdrop-blur-sm">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-300 hover:text-white hover:bg-white/20"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(bk) }}>
                                  <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  onClick={(e) => { e.stopPropagation(); handleCancel(bk.id) }}>
                                  <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}