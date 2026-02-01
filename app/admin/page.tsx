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

// --- INTERFACES (Lógica Original Intacta) ---
interface Room {
  id: string
  name: string
}

interface Productor {
  id: string
  name: string
}

interface Artista {
  id: string
  name: string
}

interface Sesion {
  id: string
  room_id: string
  productor_id: string
  artista_id: string
  fecha_inicio: string
  fecha_fin: string
  notas: string | null
  estado: 'programada' | 'en_curso' | 'completada' | 'cancelada'
  rooms: { name: string }
  productores: { name: string }
  artistas: { name: string }
}

export default function AgendaPage() {
  // --- ESTADOS (Lógica Original Intacta) ---
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [productores, setProductores] = useState<Productor[]>([])
  const [artistas, setArtistas] = useState<Artista[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSesion, setEditingSesion] = useState<Sesion | null>(null)
  
  const [filters, setFilters] = useState({
    room_id: '',
    productor_id: '',
    artista_id: '',
  })
  
  const [formData, setFormData] = useState({
    room_id: '',
    productor_id: '',
    artista_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    notas: '',
    estado: 'programada' as const,
  })
  const [errors, setErrors] = useState<string[]>([])
  const supabase = createClient()

  // Configuración de Calendario (24 HORAS SOLICITADO)
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
      // Fetch rooms, productores, artistas
      const [roomsRes, productoresRes, artistasRes] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('productores').select('*').order('name'),
        supabase.from('artistas').select('*').order('name'),
      ])

      if (roomsRes.error) throw roomsRes.error
      if (productoresRes.error) throw productoresRes.error
      if (artistasRes.error) throw artistasRes.error

      setRooms(roomsRes.data || [])
      setProductores(productoresRes.data || [])
      setArtistas(artistasRes.data || [])

      // Fetch sesiones for the week
      const weekStartUTC = fromZonedTime(weekStart, timezone)
      const weekEnd = addDays(weekStart, 7)
      const weekEndUTC = fromZonedTime(weekEnd, timezone)

      let query = supabase
        .from('sesiones')
        .select(`
          *,
          rooms(name),
          productores(name),
          artistas(name)
        `)
        .gte('fecha_inicio', weekStartUTC.toISOString())
        .lt('fecha_inicio', weekEndUTC.toISOString())
        .order('fecha_inicio', { ascending: true })

      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id)
      }
      if (filters.productor_id) {
        query = query.eq('productor_id', filters.productor_id)
      }
      if (filters.artista_id) {
        query = query.eq('artista_id', filters.artista_id)
      }

      const { data, error } = await query

      if (error) throw error
      setSesiones(data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE CONFLICTOS (IMPORTANTE: NO TOCAR) ---
  const checkConflicts = async (
    roomId: string,
    productorId: string,
    artistaId: string,
    fechaInicio: string,
    fechaFin: string,
    excludeId?: string
  ): Promise<string[]> => {
    const conflicts: string[] = []

    // Helper para reducir repetición, misma lógica que tu código original
    const checkTable = async (field: string, value: string, errorMsg: string) => {
        const { data } = await supabase
          .from('sesiones')
          .select('*')
          .eq(field, value)
          .neq('estado', 'cancelada')
          .or(`and(fecha_inicio.lt.${fechaFin},fecha_fin.gt.${fechaInicio})`)

        if (data) {
          const hasConflict = data.some(
            (s: any) => s.id !== excludeId && s.estado !== 'cancelada'
          )
          if (hasConflict) conflicts.push(errorMsg)
        }
    }

    await Promise.all([
        checkTable('room_id', roomId, 'La sala ya está ocupada en ese horario'),
        checkTable('productor_id', productorId, 'El productor ya tiene una sesión en ese horario'),
        checkTable('artista_id', artistaId, 'El artista ya tiene una sesión en ese horario')
    ])

    return conflicts
  }

  // --- MANEJO DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const fechaInicioUTC = fromZonedTime(
      parseISO(formData.fecha_inicio),
      timezone
    ).toISOString()
    const fechaFinUTC = fromZonedTime(
      parseISO(formData.fecha_fin),
      timezone
    ).toISOString()

    // Validate dates
    if (new Date(fechaFinUTC) <= new Date(fechaInicioUTC)) {
      setErrors(['La fecha de fin debe ser posterior a la fecha de inicio'])
      return
    }

    // Check conflicts
    const conflicts = await checkConflicts(
      formData.room_id,
      formData.productor_id,
      formData.artista_id,
      fechaInicioUTC,
      fechaFinUTC,
      editingSesion?.id
    )

    if (conflicts.length > 0) {
      setErrors(conflicts)
      return
    }

    try {
      const data = {
        room_id: formData.room_id,
        productor_id: formData.productor_id,
        artista_id: formData.artista_id,
        fecha_inicio: fechaInicioUTC,
        fecha_fin: fechaFinUTC,
        notas: formData.notas || null,
        estado: formData.estado,
        updated_at: new Date().toISOString(),
      }

      if (editingSesion) {
        const { error } = await supabase
          .from('sesiones')
          .update(data)
          .eq('id', editingSesion.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('sesiones').insert([data])
        if (error) throw error
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving sesion:', error)
      setErrors([error.message || 'Error al guardar la sesión'])
    }
  }

  // --- ACCIONES DE UI ---
  const handleEdit = (sesion: Sesion) => {
    // BLINDAJE: Si la fecha es inválida, no permitimos editar para evitar crash
    if (!sesion.fecha_inicio || !sesion.fecha_fin) return;

    setEditingSesion(sesion)
    const fechaInicioLocal = toZonedTime(
      parseISO(sesion.fecha_inicio),
      timezone
    )
    const fechaFinLocal = toZonedTime(parseISO(sesion.fecha_fin), timezone)

    setFormData({
      room_id: sesion.room_id,
      productor_id: sesion.productor_id,
      artista_id: sesion.artista_id,
      fecha_inicio: format(fechaInicioLocal, "yyyy-MM-dd'T'HH:mm"),
      fecha_fin: format(fechaFinLocal, "yyyy-MM-dd'T'HH:mm"),
      notas: sesion.notas || '',
      estado: sesion.estado as any,
    })
    setDialogOpen(true)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta sesión?')) return

    try {
      const { error } = await supabase
        .from('sesiones')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error canceling sesion:', error)
      alert('Error al cancelar la sesión')
    }
  }

  const resetForm = () => {
    setFormData({
      room_id: '',
      productor_id: '',
      artista_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      notas: '',
      estado: 'programada',
    })
    setEditingSesion(null)
    setErrors([])
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // --- LÓGICA DE RENDERIZADO (Aquí estaba el error del 'split') ---
  const getSesionesForSlot = (day: Date, hour: number) => {
    return sesiones.filter((sesion) => {
      // 🛡️ PROTECCIÓN ANTI-CRASH 🛡️
      // Si la base de datos devuelve una sesión sin fecha (null), la ignoramos.
      if (!sesion.fecha_inicio || !sesion.fecha_fin) return false;
      
      if (sesion.estado === 'cancelada') return false
      
      try {
        const inicio = toZonedTime(parseISO(sesion.fecha_inicio), timezone)
        const fin = toZonedTime(parseISO(sesion.fecha_fin), timezone)
        return (
            isSameDay(inicio, day) &&
            inicio.getHours() <= hour &&
            fin.getHours() > hour
        )
      } catch (e) {
          return false; // Si falla el parseo de fecha, no rompemos la app
      }
    })
  }

  const getSesionStyle = (sesion: Sesion) => {
    // Protección aquí también
    if (!sesion.fecha_inicio || !sesion.fecha_fin) return {};

    const inicio = toZonedTime(parseISO(sesion.fecha_inicio), timezone)
    const fin = toZonedTime(parseISO(sesion.fecha_fin), timezone)
    const duration = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
    const startHour = inicio.getHours() + inicio.getMinutes() / 60

    // COLORES ENTERPRISE (TEMA OSCURO)
    const colors: Record<string, string> = {
      programada: 'bg-emerald-500/20 border-emerald-500 text-emerald-100 hover:bg-emerald-500/30',
      en_curso: 'bg-amber-500/20 border-amber-500 text-amber-100 hover:bg-amber-500/30 animate-pulse',
      completada: 'bg-zinc-800/80 border-zinc-600 text-zinc-400 grayscale',
      cancelada: 'hidden', // No las mostramos en el calendario
    }

    return {
      top: `${(startHour % 1) * 60}px`,
      height: `${duration * 60}px`,
      className: `absolute left-0.5 right-0.5 border p-2 rounded-md text-[10px] leading-tight backdrop-blur-md transition-all z-10 cursor-pointer shadow-sm overflow-hidden ${colors[sesion.estado] || colors.programada}`
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
                    {editingSesion ? <Pencil className="w-5 h-5 text-emerald-500"/> : <Plus className="w-5 h-5 text-emerald-500"/>}
                    {editingSesion ? 'Editar Sesión' : 'Agendar Nueva Sesión'}
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  {editingSesion ? 'Modifica los detalles del evento.' : 'Reserva un espacio en el estudio.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="room_id" className="text-xs font-bold text-zinc-400 uppercase">Sala</Label>
                      {/* Usamos select nativo con estilos Tailwind para asegurar modo oscuro */}
                      <select id="room_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })} required>
                        <option value="">Seleccionar sala...</option>
                        {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="estado" className="text-xs font-bold text-zinc-400 uppercase">Estado</Label>
                      <select id="estado" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}>
                        <option value="programada">📅 Programada</option>
                        <option value="en_curso">🔴 En Curso</option>
                        <option value="completada">✅ Completada</option>
                        <option value="cancelada">❌ Cancelada</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="productor_id" className="text-xs font-bold text-zinc-400 uppercase">Productor</Label>
                      <select id="productor_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.productor_id} onChange={(e) => setFormData({ ...formData, productor_id: e.target.value })} required>
                        <option value="">Seleccionar...</option>
                        {productores.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="artista_id" className="text-xs font-bold text-zinc-400 uppercase">Artista</Label>
                      <select id="artista_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.artista_id} onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })} required>
                        <option value="">Seleccionar...</option>
                        {artistas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_inicio" className="text-xs font-bold text-zinc-400 uppercase">Inicio</Label>
                      <Input id="fecha_inicio" type="datetime-local" className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                        value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_fin" className="text-xs font-bold text-zinc-400 uppercase">Fin</Label>
                      <Input id="fecha_fin" type="datetime-local" className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                        value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} required />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="notas" className="text-xs font-bold text-zinc-400 uppercase">Notas</Label>
                    <Textarea id="notas" className="bg-zinc-900 border-zinc-800 text-white resize-none focus:ring-emerald-500"
                      value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows={3} placeholder="Detalles técnicos, requerimientos, etc..." />
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
                      {editingSesion ? 'Guardar Cambios' : 'Crear Sesión'}
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
                <Label htmlFor="filter_productor" className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Por Productor</Label>
                <select id="filter_productor" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 outline-none"
                    value={filters.productor_id} onChange={(e) => setFilters({ ...filters, productor_id: e.target.value })}>
                    <option value="">Todos los productores</option>
                    {productores.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             <div>
                <Label htmlFor="filter_artista" className="text-[10px] text-zinc-600 uppercase font-bold mb-1 block">Por Artista</Label>
                <select id="filter_artista" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 outline-none"
                    value={filters.artista_id} onChange={(e) => setFilters({ ...filters, artista_id: e.target.value })}>
                    <option value="">Todos los artistas</option>
                    {artistas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
                  const sesionesEnSlot = getSesionesForSlot(day, hour)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div key={`${day.toISOString()}-${hour}`} className={`relative border-r border-b border-zinc-800/30 transition-colors group ${isToday ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/20'}`}>
                      {/* Renderizado de Sesiones */}
                      {sesionesEnSlot.map((sesion) => {
                        const style = getSesionStyle(sesion)
                        return (
                          <div
                            key={sesion.id}
                            className={style.className}
                            style={style as any}
                            onClick={() => handleEdit(sesion)}
                            title={`${sesion.rooms.name} - ${sesion.productores.name} / ${sesion.artistas.name}`}
                          >
                            <div className="font-bold truncate text-[11px] mb-0.5 text-white shadow-black drop-shadow-md">
                              {sesion.rooms.name}
                            </div>
                            <div className="truncate text-[9px] opacity-90 font-medium">
                              {sesion.productores.name}
                            </div>
                            <div className="truncate text-[9px] opacity-75">
                              ft. {sesion.artistas.name}
                            </div>

                            {/* Acciones Rápidas (Hover) */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5 backdrop-blur-sm">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-300 hover:text-white hover:bg-white/20"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(sesion) }}>
                                  <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  onClick={(e) => { e.stopPropagation(); handleCancel(sesion.id) }}>
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