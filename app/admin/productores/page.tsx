'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Productor {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export default function ProductoresPage() {
  const [productores, setProductores] = useState<Productor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProductor, setEditingProductor] = useState<Productor | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const supabase = createClient()

  const fetchProductores = async () => {
    try {
      const { data, error } = await supabase
        .from('productores')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProductores(data || [])
    } catch (error) {
      console.error('Error fetching productores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductores()
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

      if (editingProductor) {
        const { error } = await supabase
          .from('productores')
          .update(data)
          .eq('id', editingProductor.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('productores')
          .insert([data])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingProductor(null)
      setName('')
      setEmail('')
      setPhone('')
      fetchProductores()
    } catch (error) {
      console.error('Error saving productor:', error)
      alert('Error al guardar el productor')
    }
  }

  const handleEdit = (productor: Productor) => {
    setEditingProductor(productor)
    setName(productor.name)
    setEmail(productor.email || '')
    setPhone(productor.phone || '')
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este productor?')) return

    try {
      const { error } = await supabase
        .from('productores')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProductores()
    } catch (error) {
      console.error('Error deleting productor:', error)
      alert('Error al eliminar el productor')
    }
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingProductor(null)
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
          <h2 className="text-3xl font-bold text-gray-900">Productores</h2>
          <p className="text-gray-600 mt-1">Gestiona los productores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Productor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProductor ? 'Editar Productor' : 'Nuevo Productor'}
              </DialogTitle>
              <DialogDescription>
                {editingProductor
                  ? 'Modifica los datos del productor'
                  : 'Agrega un nuevo productor'}
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
                  {editingProductor ? 'Guardar Cambios' : 'Crear Productor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productores.map((productor) => (
          <Card key={productor.id}>
            <CardHeader>
              <CardTitle>{productor.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                {productor.email && <p>📧 {productor.email}</p>}
                {productor.phone && <p>📞 {productor.phone}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(productor)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(productor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productores.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No hay productores registrados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
