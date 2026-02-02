'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Mic2 } from 'lucide-react'

// INTERFACE EN INGLÉS
interface Producer {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export default function ProducersPage() {
  const [producers, setProducers] = useState<Producer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  const supabase = createClient()

  const fetchProducers = async () => {
    try {
      // 🟢 CONSULTA A LA TABLA EN INGLÉS
      const { data, error } = await supabase
        .from('producers') 
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProducers(data || [])
    } catch (error) {
      console.error('Error fetching producers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name,
        email: email || null,
        phone: phone || null,
      }

      if (editingProducer) {
        // 🟢 UPDATE A LA TABLA EN INGLÉS
        const { error } = await supabase
          .from('producers')
          .update(data)
          .eq('id', editingProducer.id)

        if (error) throw error
      } else {
        // 🟢 INSERT A LA TABLA EN INGLÉS
        const { error } = await supabase
          .from('producers')
          .insert([data])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingProducer(null)
      setName('')
      setEmail('')
      setPhone('')
      fetchProducers()
    } catch (error) {
      console.error('Error saving producer:', error)
      alert('Error al guardar el productor')
    }
  }

  const handleEdit = (producer: Producer) => {
    setEditingProducer(producer)
    setName(producer.name)
    setEmail(producer.email || '')
    setPhone(producer.phone || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este productor?')) return

    try {
      // 🟢 DELETE A LA TABLA EN INGLÉS
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducers()
    } catch (error) {
      console.error('Error deleting producer:', error)
      alert('Error al eliminar el productor')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingProducer(null)
      setName('')
      setEmail('')
      setPhone('')
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-emerald-500 animate-pulse font-bold tracking-widest">CARGANDO PRODUCTORES...</div>
  }

  return (
    // ESTILO DARK ENTERPRISE
    <div className="p-8 min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Mic2 className="text-emerald-500" /> Productores
          </h2>
          <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold border-l-2 border-emerald-500 pl-3 ml-1">
            Gestiona el equipo de producción
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-emerald-400 hover:text-black font-bold rounded-xl text-xs gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all">
              <Plus className="h-4 w-4" />
              NUEVO PRODUCTOR
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F1112] border-zinc-800 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProducer ? 'Editar Productor' : 'Nuevo Productor'}
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                {editingProducer ? 'Modifica los datos del productor' : 'Agrega un nuevo miembro al equipo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400 font-bold uppercase text-xs">Nombre *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo"
                    required
                    className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400 font-bold uppercase text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-400 font-bold uppercase text-xs">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-500 hover:text-white hover:bg-zinc-800">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                  {editingProducer ? 'Guardar Cambios' : 'Crear Productor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {producers.map((producer) => (
          <Card key={producer.id} className="bg-zinc-900/50 border-zinc-800 text-zinc-300 backdrop-blur-sm hover:border-emerald-500/30 transition-all group">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg font-bold group-hover:text-emerald-400 transition-colors">{producer.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-zinc-500 font-mono mb-4">
                {producer.email ? <p className="flex items-center gap-2">📧 {producer.email}</p> : <p className="opacity-30">Sin email</p>}
                {producer.phone ? <p className="flex items-center gap-2">📞 {producer.phone}</p> : <p className="opacity-30">Sin teléfono</p>}
              </div>
              <div className="flex gap-2 justify-end border-t border-zinc-800 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(producer)}
                  className="h-8 w-8 p-0 hover:text-white hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(producer.id)}
                  className="h-8 w-8 p-0 text-red-900 hover:text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {producers.length === 0 && (
        <Card className="bg-transparent border-dashed border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-600 flex flex-col items-center">
            <Mic2 className="w-12 h-12 mb-4 opacity-20" />
            <p>No hay productores registrados.</p>
            <p className="text-xs mt-2 opacity-50">Comienza a armar tu equipo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}