"use client"; // Añadimos esto para permitir interactividad futura

import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowRight, Mic2, Play, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo"; // Importamos el logo

const outfit = Outfit({ subsets: ["latin"] });

export default function HomeLanding() {
  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 selection:bg-emerald-500/30 ${outfit.className} overflow-x-hidden`}>
      
      {/* --- ILUMINACIÓN AMBIENTAL --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen opacity-60" />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0F1112]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* USAMOS EL LOGO AQUÍ */}
            <Logo size="text-xl" />
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Características</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Seguridad</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/calendar" className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500">
              <span>Ingresar</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400">
          <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          TurnoAquí v2.0 - Consola de Operaciones
        </div>

        {/* LOGO GRANDE EN EL HERO */}
        <div className="mb-8">
           <Logo size="text-6xl md:text-8xl" />
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl mb-8 leading-[1.1]">
          Gestiona tu estudio <br />
          <span className="text-gray-500">sin ruido visual.</span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link 
            href="/calendar" 
            className="h-14 px-10 rounded-2xl bg-white text-black font-black flex items-center justify-center hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest"
          >
            Entrar a la Consola
          </Link>
        </div>
      </main>
    </div>
  );
}