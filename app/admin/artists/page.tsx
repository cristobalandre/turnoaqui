'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

// INTERFACE EN INGLÉS
interface Artist {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export default function ArtistsPage() { // Renombrado componente
  const [artists, setArtists] = useState<Artist[]>([]) // Variable renombrada
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null) // Variable renombrada
  
  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  const supabase = createClient()

  const fetchArtists = async () => {
    try {
      // 🟢 CONSULTA A LA TABLA EN INGLÉS
      const { data, error } = await supabase
        .from('artists') 
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setArtists(data || [])
    } catch (error) {
      console.error('Error fetching artists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtists()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name,
        email: email || null,
        phone: phone || null,
        // updated_at: new Date().toISOString(), // Supabase suele manejar esto auto, pero puedes dejarlo
      }

      if (editingArtist) {
        // 🟢 UPDATE A LA TABLA EN INGLÉS
        const { error } = await supabase
          .from('artists')
          .update(data)
          .eq('id', editingArtist.id)

        if (error) throw error
      } else {
        // 🟢 INSERT A LA TABLA EN INGLÉS
        const { error } = await supabase
          .from('artists')
          .insert([data])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingArtist(null)
      setName('')
      setEmail('')
      setPhone('')
      fetchArtists()
    } catch (error) {
      console.error('Error saving artist:', error)
      alert('Error al guardar el artista')
    }
  }

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist)
    setName(artist.name)
    setEmail(artist.email || '')
    setPhone(artist.phone || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artista?')) return

    try {
      // 🟢 DELETE A LA TABLA EN INGLÉS
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchArtists()
    } catch (error) {
      console.error('Error deleting artist:', error)
      alert('Error al eliminar el artista')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingArtist(null)
      setName('')
      setEmail('')
      setPhone('')
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-emerald-500 animate-pulse font-bold tracking-widest">CARGANDO ARTISTAS...</div>
  }

  return (
    // Agregué clases de fondo oscuro para que combine con el resto del admin
    <div className="p-8 min-h-screen bg-[#09090b] text-zinc-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-emerald-500" /> Artistas
          </h2>
          <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold">Gestiona el roster del estudio</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-emerald-400 hover:text-black font-bold rounded-xl text-xs gap-2">
              <Plus className="h-4 w-4" />
              NUEVO ARTISTA
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F1112] border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingArtist ? 'Editar Artista' : 'Nuevo Artista'}
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                {editingArtist ? 'Modifica los datos del artista' : 'Agrega un nuevo artista al sistema'}
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
                    placeholder="Nombre artístico"
                    required
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400 font-bold uppercase text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@artista.com"
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-400 font-bold uppercase text-xs">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-500 hover:text-white">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                  {editingArtist ? 'Guardar Cambios' : 'Crear Artista'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Card key={artist.id} className="bg-zinc-900/50 border-zinc-800 text-zinc-300">
            <CardHeader>
              <CardTitle className="text-white">{artist.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-zinc-500 font-mono">
                {artist.email && <p>📧 {artist.email}</p>}
                {artist.phone && <p>📞 {artist.phone}</p>}
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(artist)}
                  className="hover:text-white hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(artist.id)}
                  className="text-red-900 hover:text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {artists.length === 0 && (
        <Card className="bg-transparent border-dashed border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-600">
            <p>No hay artistas registrados en la nueva base de datos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}