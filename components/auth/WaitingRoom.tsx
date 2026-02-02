'use client' // Es visual, así que usa client

import { Loader2 } from 'lucide-react'

export default function WaitingRoom() {
  return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
        {/* Icono animado */}
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
        
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Solicitud en Revisión
        </h1>
        
        <p className="text-zinc-400 text-lg">
            Tu cuenta ha sido creada exitosamente, pero requiere la aprobación de un <strong className="text-amber-500">Administrador Maestro</strong>.
        </p>
        
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-500">
            <p>Estado actual: <span className="text-amber-500 font-mono font-bold uppercase">PENDING</span></p>
            <p className="mt-2">Por favor espera o contacta al soporte si esto es un error.</p>
        </div>

        <button 
            onClick={() => window.location.reload()} 
            className="text-emerald-500 hover:text-emerald-400 text-sm font-bold tracking-widest uppercase hover:underline"
        >
            Verificar estado nuevamente
        </button>
      </div>
    </div>
  )
}