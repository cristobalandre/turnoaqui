'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, XCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

// 🔒 LISTA BLANCA DE SUPER ADMINS
const GOD_EMAILS = [
  'cristobal.andres27@outlook.com', 
  'cristobal.andres.inta@gmail.com'
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
    
    // 🛡️ SEGURIDAD FRONTEND
    if (!user || !GOD_EMAILS.includes(user.email || '')) {
       router.push('/dashboard') 
       return
    }
    
    setIsGod(true)
    fetchRequests()
  }

  const fetchRequests = async () => {
    setLoading(true)
    
    // 1. BAJAMOS TODO (Sin filtros en la BD para evitar problemas de RLS silenciosos)
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error crítico cargando base de datos:", error)
        alert("Error conectando con Supabase. Revisa la consola.")
    } else {
        const allProfiles = data || []
        
        // 🕵️ DEBUGGING: Esto te mostrará en la consola (F12) qué está pasando realmente
        console.log("--- DEBUG GOD MODE ---")
        console.log("Total usuarios descargados:", allProfiles.length)
        allProfiles.forEach(u => console.log(`Usuario: ${u.full_name} | Estado: "${u.plan_status}"`))
        
        // 👇 EL FILTRO RELAJADO:
        // Mostramos cualquier cosa que NO sea 'active'. 
        // Esto incluirá: 'pending', 'rejected', null, '', undefined, etc.
        const pending = allProfiles.filter(u => u.plan_status !== 'active')
        
        console.log("Filtrados para mostrar:", pending.length)
        
        setRequests(pending)
    }
    setLoading(false)
  }

  const handleDecision = async (userId: string, decision: 'approve' | 'reject') => {
    if (!confirm(`¿Confirmas ${decision === 'approve' ? 'APROBAR' : 'RECHAZAR'} a este usuario?`)) return

    if (decision === 'approve') {
        // ✅ APROBAR: Pasa a 'active'
        const { error } = await supabase.from('profiles').update({ plan_status: 'active' }).eq('id', userId)
        if (error) alert("Error al aprobar: " + error.message)
    } else {
        // ❌ RECHAZAR: Pasa a 'rejected'
        const { error } = await supabase.from('profiles').update({ plan_status: 'rejected' }).eq('id', userId)
        if (error) alert("Error al rechazar: " + error.message)
    }
    
    // Recargamos la lista
    fetchRequests()
  }

  if (!isGod) return null 

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono selection:bg-red-900/30">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-red-900/30 pb-6 gap-6">
            <div>
                <h1 className="text-4xl font-bold text-red-600 flex items-center gap-3 tracking-tighter">
                    <ShieldCheck className="w-10 h-10" /> GOD MODE
                </h1>
                <p className="text-zinc-500 mt-2 text-sm">Panel de Control Maestro • v2.1 (Filtro Relajado)</p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    {GOD_EMAILS.map(email => (
                        <div key={email} className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded border border-zinc-800 text-[10px] uppercase tracking-wider">
                            ADMIN: {email.split('@')[0]}
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests} className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <RefreshCw className="w-3 h-3 mr-2" /> Recargar Datos
                </Button>
            </div>
        </header>

        <h2 className="text-xl font-bold text-zinc-200 mb-6 flex items-center gap-3">
            Solicitudes Pendientes 
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${requests.length > 0 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                {requests.length}
            </span>
        </h2>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="animate-spin text-red-600 w-8 h-8"/>
                <span className="text-xs text-red-500/50 uppercase tracking-widest">Escaneando Base de Datos...</span>
            </div>
        ) : requests.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/50">
                <p className="text-zinc-700 text-lg font-light">No hay usuarios pendientes.</p>
                <p className="text-zinc-800 text-xs mt-2 uppercase tracking-widest">
                    (Se encontraron {requests.length} usuarios, pero todos están 'active')
                </p>
            </div>
        ) : (
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {requests.map((req) => (
                    <div key={req.id} className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            {/* Avatar o Inicial */}
                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 font-bold text-xl border border-zinc-800">
                                {req.avatar_url ? (
                                    <img src={req.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    req.full_name?.charAt(0) || "?"
                                )}
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition-colors">
                                    {req.full_name || 'Usuario Sin Nombre'}
                                </h3>
                                <p className="text-zinc-500 text-xs font-mono mb-1">{req.email}</p>
                                <div className="flex items-center gap-2">
                                    {/* Mostramos el estado real para debuggear visualmente */}
                                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 uppercase font-bold tracking-wider">
                                        Estado: {req.plan_status || 'NULL'}
                                    </span>
                                    <span className="text-[10px] text-zinc-600">
                                        ID: {req.id.substring(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                                onClick={() => handleDecision(req.id, 'reject')}
                                className="flex-1 md:flex-none bg-zinc-900 hover:bg-red-950/30 text-zinc-400 hover:text-red-500 border border-zinc-800 hover:border-red-500/30 transition-all"
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Rechazar
                            </Button>
                            <Button 
                                onClick={() => handleDecision(req.id, 'approve')}
                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-500 shadow-lg shadow-emerald-900/20"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> APROBAR
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