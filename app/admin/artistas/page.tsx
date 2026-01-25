'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Artista {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export default function ArtistasPage() {
  const [artistas, setArtistas] = useState<Artista[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingArtista, setEditingArtista] = useState<Artista | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const supabase = createClient()

  const fetchArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setArtistas(data || [])
    } catch (error) {
      console.error('Error fetching artistas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtistas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name,
        email: email || null,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      }

      if (editingArtista) {
        const { error } = await supabase
          .from('artistas')
          .update(data)
          .eq('id', editingArtista.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('artistas')
          .insert([data])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingArtista(null)
      setName('')
      setEmail('')
      setPhone('')
      fetchArtistas()
    } catch (error) {
      console.error('Error saving artista:', error)
      alert('Error al guardar el artista')
    }
  }

  const handleEdit = (artista: Artista) => {
    setEditingArtista(artista)
    setName(artista.name)
    setEmail(artista.email || '')
    setPhone(artista.phone || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artista?')) return

    try {
      const { error } = await supabase
        .from('artistas')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchArtistas()
    } catch (error) {
      console.error('Error deleting artista:', error)
      alert('Error al eliminar el artista')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingArtista(null)
      setName('')
      setEmail('')
      setPhone('')
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Artistas</h2>
          <p className="text-gray-600 mt-1">Gestiona los artistas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Artista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingArtista ? 'Editar Artista' : 'Nuevo Artista'}
              </DialogTitle>
              <DialogDescription>
                {editingArtista
                  ? 'Modifica los datos del artista'
                  : 'Agrega un nuevo artista'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
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
                  {editingArtista ? 'Guardar Cambios' : 'Crear Artista'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artistas.map((artista) => (
          <Card key={artista.id}>
            <CardHeader>
              <CardTitle>{artista.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                {artista.email && <p>📧 {artista.email}</p>}
                {artista.phone && <p>📞 {artista.phone}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(artista)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(artista.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {artistas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No hay artistas registrados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
