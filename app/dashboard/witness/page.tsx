import WitnessRecorder from '@/components/studio/WitnessRecorder'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WitnessPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-mono">
      
      {/* Navegación Superior */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Studio Session AI</h1>
          <p className="text-zinc-500 text-xs">Herramienta de Análisis y Protección de Derechos</p>
        </div>
      </div>

      {/* Aquí cargamos la "Caja Negra" */}
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
         <WitnessRecorder />
         
         <div className="mt-8 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
              CONFIDENCIAL • SESIÓN ENCRIPTADA LOCALMENTE • V2.1
            </p>
         </div>
      </div>

    </div>
  )
}