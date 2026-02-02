'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, XCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// 🔒 LISTA BLANCA DE SUPER ADMINS (Solo tú)
const GOD_EMAILS = [
  'cristobal.andres27@outlook.com', 
  'tu.correo.google@gmail.com' 
]

export default function GodModePage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGod, setIsGod] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkGodStatus()
  }, [])

  const checkGodStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 🛡️ SEGURIDAD: Si no eres tú, te expulsa
    if (!user || !GOD_EMAILS.includes(user.email || '')) {
       router.push('/dashboard') // Lo mandamos lejos
       return
    }
    
    setIsGod(true)
    fetchPendingRequests()
  }

  const fetchPendingRequests = async () => {
    setLoading(true)  
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('plan_status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error cargando solicitudes:", error)
    } else {
        setRequests(data || [])
    }
    setLoading(false)
  }

  const handleDecision = async (userId: string, decision: 'approve' | 'reject') => {
    if (!confirm(`¿Estás seguro de ${decision === 'approve' ? 'APROBAR' : 'RECHAZAR'} a este usuario?`)) return

    if (decision === 'approve') {
        // ✅ APROBAR: Cambiamos estado a 'active'
        await supabase.from('profiles').update({ plan_status: 'active' }).eq('id', userId)
        // También activamos su organización si es necesario
    } else {
        // ❌ RECHAZAR: Podríamos borrarlo o dejarlo como 'banned'
        await supabase.from('profiles').update({ plan_status: 'rejected' }).eq('id', userId)
    }
    
    fetchPendingRequests() // Recargar lista
  }

  if (!isGod) return null // Pantalla negra si no eres dios

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-red-900/50 pb-6">
            <div>
                <h1 className="text-4xl font-bold text-red-500 flex items-center gap-3">
                    <ShieldCheck className="w-10 h-10" /> GOD MODE
                </h1>
                <p className="text-zinc-500 mt-2">Panel de Control Maestro - Acceso Restringido</p>
            </div>
            <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded border border-red-500/20 text-xs">
                USUARIO: {GOD_EMAILS[0]}
            </div>
        </header>

        <h2 className="text-xl font-bold text-zinc-300 mb-6 flex items-center gap-2">
            Solicitudes Pendientes <span className="bg-zinc-800 text-white text-xs px-2 py-1 rounded-full">{requests.length}</span>
        </h2>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-500 w-10 h-10"/></div>
        ) : requests.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl text-zinc-600">
                No hay almas esperando en el limbo hoy.
            </div>
        ) : (
            <div className="grid gap-4">
                {requests.map((req) => (
                    <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-zinc-700 transition-colors">
                        <div>
                            <h3 className="text-lg font-bold text-white">{req.full_name || 'Sin Nombre'}</h3>
                            <p className="text-zinc-400 text-sm">{req.email}</p>
                            <div className="flex gap-2 mt-2 text-xs">
                                <span className="bg-zinc-800 px-2 py-1 rounded">Org: {req.organizations?.name || 'N/A'}</span>
                                <span className="bg-zinc-800 px-2 py-1 rounded">Plan: {req.organizations?.plan_type || 'N/A'}</span>
                                <span className="text-zinc-500 py-1">Registrado: {new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => handleDecision(req.id, 'reject')}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                            >
                                <XCircle className="w-4 h-4 mr-2" /> RECHAZAR
                            </Button>
                            <Button 
                                onClick={() => handleDecision(req.id, 'approve')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> APROBAR ACCESO
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}