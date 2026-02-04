'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Terminal, Trash2, Smartphone, Monitor } from 'lucide-react'

export default function DebugConsole() {
  const [logs, setLogs] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 1. Cargar logs existentes
    const fetchLogs = async () => {
      const { data } = await supabase.from('debug_logs').select('*').order('created_at', { ascending: false }).limit(50)
      if (data) setLogs(data)
    }
    fetchLogs()

    // 2. Escuchar en TIEMPO REAL (La magia simultánea)
    const channel = supabase
      .channel('debug-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const clearLogs = async () => {
      await supabase.from('debug_logs').delete().neq('id', 0) // Borrar todo
      setLogs([])
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-10">
      <div className="max-w-4xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl overflow-hidden">
        
        {/* Cabecera Terminal */}
        <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-white" />
                <span className="text-white font-bold tracking-wider text-sm">REMOTE DEBUGGER v1.0</span>
            </div>
            <button onClick={clearLogs} className="p-2 hover:bg-red-900/30 rounded text-red-500 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
            </button>
        </div>

        {/* Lista de Logs */}
        <div className="h-[600px] overflow-y-auto p-4 space-y-2">
            {logs.length === 0 && <div className="text-zinc-600 italic text-center mt-20">Esperando conexión entrante del iPhone...</div>}
            
            {logs.map((log) => (
                <div key={log.id} className="border-b border-zinc-900 pb-2 mb-2 hover:bg-zinc-900/30 p-2 rounded transition-colors">
                    <div className="flex items-center gap-3 mb-1 text-xs text-zinc-500">
                        <span className="text-blue-400">
                            {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        <span className={`flex items-center gap-1 font-bold ${log.device?.includes('iPHONE') ? 'text-purple-400' : 'text-zinc-400'}`}>
                            {log.device?.includes('iPHONE') ? <Smartphone size={10} /> : <Monitor size={10} />}
                            {log.device}
                        </span>
                    </div>
                    <div className="text-sm text-zinc-300 font-bold mb-1">
                        &gt; {log.error_message}
                    </div>
                    {log.details && log.details !== '""' && (
                        <pre className="text-[10px] text-zinc-500 bg-black p-2 rounded overflow-x-auto border border-zinc-900">
                            {log.details}
                        </pre>
                    )}
                </div>
            ))}
        </div>

      </div>
    </div>
  )
}