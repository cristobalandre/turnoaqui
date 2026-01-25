import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, Users, Mic, Building2 } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!adminData) {
    redirect('/login')
  }

  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  AgendaPro - Estudio de Grabación
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-gray-900"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Agenda
                </Link>
                <Link
                  href="/admin/rooms"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Salas
                </Link>
                <Link
                  href="/admin/productores"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Productores
                </Link>
                <Link
                  href="/admin/artistas"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Artistas
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <form action={handleLogout}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
