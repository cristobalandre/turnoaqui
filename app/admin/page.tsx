'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Pencil, X } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO, isSameDay, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'

const timezone = 'America/Santiago'

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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i)

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
      const weekStartUTC = zonedTimeToUtc(weekStart, timezone)
      const weekEnd = addDays(weekStart, 7)
      const weekEndUTC = zonedTimeToUtc(weekEnd, timezone)

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

  const checkConflicts = async (
    roomId: string,
    productorId: string,
    artistaId: string,
    fechaInicio: string,
    fechaFin: string,
    excludeId?: string
  ): Promise<string[]> => {
    const conflicts: string[] = []

    // Check room conflicts
    const { data: roomConflicts } = await supabase
      .from('sesiones')
      .select('*')
      .eq('room_id', roomId)
      .neq('estado', 'cancelada')
      .or(`and(fecha_inicio.lt.${fechaFin},fecha_fin.gt.${fechaInicio})`)

    if (roomConflicts) {
      const hasConflict = roomConflicts.some(
        (s) => s.id !== excludeId && s.estado !== 'cancelada'
      )
      if (hasConflict) {
        conflicts.push('La sala ya está ocupada en ese horario')
      }
    }

    // Check productor conflicts
    const { data: productorConflicts } = await supabase
      .from('sesiones')
      .select('*')
      .eq('productor_id', productorId)
      .neq('estado', 'cancelada')
      .or(`and(fecha_inicio.lt.${fechaFin},fecha_fin.gt.${fechaInicio})`)

    if (productorConflicts) {
      const hasConflict = productorConflicts.some(
        (s) => s.id !== excludeId && s.estado !== 'cancelada'
      )
      if (hasConflict) {
        conflicts.push('El productor ya tiene una sesión en ese horario')
      }
    }

    // Check artista conflicts
    const { data: artistaConflicts } = await supabase
      .from('sesiones')
      .select('*')
      .eq('artista_id', artistaId)
      .neq('estado', 'cancelada')
      .or(`and(fecha_inicio.lt.${fechaFin},fecha_fin.gt.${fechaInicio})`)

    if (artistaConflicts) {
      const hasConflict = artistaConflicts.some(
        (s) => s.id !== excludeId && s.estado !== 'cancelada'
      )
      if (hasConflict) {
        conflicts.push('El artista ya tiene una sesión en ese horario')
      }
    }

    return conflicts
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const fechaInicioUTC = zonedTimeToUtc(
      parseISO(formData.fecha_inicio),
      timezone
    ).toISOString()
    const fechaFinUTC = zonedTimeToUtc(
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

  const handleEdit = (sesion: Sesion) => {
    setEditingSesion(sesion)
    const fechaInicioLocal = utcToZonedTime(
      parseISO(sesion.fecha_inicio),
      timezone
    )
    const fechaFinLocal = utcToZonedTime(parseISO(sesion.fecha_fin), timezone)

    setFormData({
      room_id: sesion.room_id,
      productor_id: sesion.productor_id,
      artista_id: sesion.artista_id,
      fecha_inicio: format(fechaInicioLocal, "yyyy-MM-dd'T'HH:mm"),
      fecha_fin: format(fechaFinLocal, "yyyy-MM-dd'T'HH:mm"),
      notas: sesion.notas || '',
      estado: sesion.estado,
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

  const getSesionesForSlot = (day: Date, hour: number) => {
    const slotStart = new Date(day)
    slotStart.setHours(hour, 0, 0, 0)
    const slotEnd = new Date(day)
    slotEnd.setHours(hour + 1, 0, 0, 0)

    return sesiones.filter((sesion) => {
      if (sesion.estado === 'cancelada') return false
      const inicio = utcToZonedTime(parseISO(sesion.fecha_inicio), timezone)
      const fin = utcToZonedTime(parseISO(sesion.fecha_fin), timezone)
      return (
        isSameDay(inicio, day) &&
        inicio.getHours() <= hour &&
        fin.getHours() > hour
      )
    })
  }

  const getSesionStyle = (sesion: Sesion) => {
    const inicio = utcToZonedTime(parseISO(sesion.fecha_inicio), timezone)
    const fin = utcToZonedTime(parseISO(sesion.fecha_fin), timezone)
    const duration = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
    const startHour = inicio.getHours() + inicio.getMinutes() / 60

    const colors: Record<string, string> = {
      programada: 'bg-blue-500',
      en_curso: 'bg-green-500',
      completada: 'bg-gray-400',
      cancelada: 'bg-red-300',
    }

    return {
      top: `${startHour * 60}px`,
      height: `${duration * 60}px`,
      backgroundColor: colors[sesion.estado] || colors.programada,
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Agenda Semanal</h2>
          <p className="text-gray-600 mt-1">
            {format(weekStart, "d 'de' MMMM", { locale: es })} -{' '}
            {format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSesion ? 'Editar Sesión' : 'Nueva Sesión'}
                </DialogTitle>
                <DialogDescription>
                  {editingSesion
                    ? 'Modifica los datos de la sesión'
                    : 'Crea una nueva sesión de grabación'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room_id">Sala *</Label>
                      <Select
                        id="room_id"
                        value={formData.room_id}
                        onChange={(e) =>
                          setFormData({ ...formData, room_id: e.target.value })
                        }
                        required
                      >
                        <option value="">Seleccionar sala</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        id="estado"
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estado: e.target.value as any,
                          })
                        }
                      >
                        <option value="programada">Programada</option>
                        <option value="en_curso">En Curso</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productor_id">Productor *</Label>
                      <Select
                        id="productor_id"
                        value={formData.productor_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            productor_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccionar productor</option>
                        {productores.map((productor) => (
                          <option key={productor.id} value={productor.id}>
                            {productor.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artista_id">Artista *</Label>
                      <Select
                        id="artista_id"
                        value={formData.artista_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            artista_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Seleccionar artista</option>
                        {artistas.map((artista) => (
                          <option key={artista.id} value={artista.id}>
                            {artista.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha_inicio">Fecha y Hora Inicio *</Label>
                      <Input
                        id="fecha_inicio"
                        type="datetime-local"
                        value={formData.fecha_inicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_inicio: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_fin">Fecha y Hora Fin *</Label>
                      <Input
                        id="fecha_fin"
                        type="datetime-local"
                        value={formData.fecha_fin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_fin: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) =>
                        setFormData({ ...formData, notas: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  {errors.length > 0 && (
                    <div className="space-y-1">
                      {errors.map((error, i) => (
                        <div
                          key={i}
                          className="text-sm text-red-600 bg-red-50 p-2 rounded"
                        >
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSesion ? 'Guardar Cambios' : 'Crear Sesión'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter_room">Filtrar por Sala</Label>
              <Select
                id="filter_room"
                value={filters.room_id}
                onChange={(e) =>
                  setFilters({ ...filters, room_id: e.target.value })
                }
              >
                <option value="">Todas las salas</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter_productor">Filtrar por Productor</Label>
              <Select
                id="filter_productor"
                value={filters.productor_id}
                onChange={(e) =>
                  setFilters({ ...filters, productor_id: e.target.value })
                }
              >
                <option value="">Todos los productores</option>
                {productores.map((productor) => (
                  <option key={productor.id} value={productor.id}>
                    {productor.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter_artista">Filtrar por Artista</Label>
              <Select
                id="filter_artista"
                value={filters.artista_id}
                onChange={(e) =>
                  setFilters({ ...filters, artista_id: e.target.value })
                }
              >
                <option value="">Todos los artistas</option>
                {artistas.map((artista) => (
                  <option key={artista.id} value={artista.id}>
                    {artista.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-8 border rounded-lg overflow-hidden">
            {/* Header de horas */}
            <div className="border-r bg-gray-50 p-2 font-semibold text-sm">
              Hora
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r bg-gray-50 p-2 text-center font-semibold text-sm"
              >
                <div>{format(day, 'EEE', { locale: es })}</div>
                <div className="text-xs text-gray-600">
                  {format(day, 'd MMM', { locale: es })}
                </div>
              </div>
            ))}

            {/* Filas de horas */}
            {hours.map((hour) => (
              <>
                <div
                  key={`hour-${hour}`}
                  className="border-r border-t bg-gray-50 p-2 text-xs text-gray-600"
                >
                  {hour}:00
                </div>
                {weekDays.map((day) => {
                  const sesionesEnSlot = getSesionesForSlot(day, hour)
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-r border-t relative min-h-[60px]"
                    >
                      {sesionesEnSlot.map((sesion) => {
                        const style = getSesionStyle(sesion)
                        return (
                          <div
                            key={sesion.id}
                            className="absolute left-0 right-0 text-white text-xs p-1 rounded cursor-pointer hover:opacity-80"
                            style={style}
                            onClick={() => handleEdit(sesion)}
                            title={`${sesion.rooms.name} - ${sesion.productores.name} / ${sesion.artistas.name}`}
                          >
                            <div className="font-semibold truncate">
                              {sesion.rooms.name}
                            </div>
                            <div className="truncate text-[10px]">
                              {sesion.productores.name} / {sesion.artistas.name}
                            </div>
                            <div className="flex gap-1 mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 px-1 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(sesion)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 px-1 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancel(sesion.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
