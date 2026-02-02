'use client'

import { Check, Lock, Sparkles, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PricingSection() {
  
  const plans = [
    {
      name: "SOLO ACCESS",
      price: "$0",
      period: "/24 hrs",
      description: "Acceso total inmediato. Sin tarjeta de crédito. Tu cuenta se autodestruye en 24h.",
      features: [
        "Panel de Control Enterprise",
        "Agenda Inteligente",
        "Gestión de Salas y Staff",
        "Sin compromiso"
      ],
      buttonText: "INICIAR PRUEBA DE CONCEPTO",
      href: "/login?plan=trial", // 👈 ESTE LINK ACTIVA EL TRIGGER DE 24H
      active: true, 
      icon: <Zap className="w-5 h-5 text-emerald-400" />
    },
    {
      name: "STARTUP",
      price: "$45.000",
      period: "/mes",
      description: "Para estudios consolidados que necesitan escalar su operación.",
      features: [
        "Hasta 5 Miembros de Equipo",
        "Roles y Permisos Avanzados",
        "Reportes Financieros",
        "Soporte Prioritario"
      ],
      buttonText: "LISTA DE ESPERA",
      href: "#",
      active: false,
      icon: <Sparkles className="w-5 h-5 text-zinc-500" />
    },
    {
      name: "ENTERPRISE",
      price: "A Medida",
      period: "",
      description: "Infraestructura dedicada para grandes cadenas y franquicias.",
      features: [
        "Usuarios Ilimitados",
        "API & Webhooks",
        "Auditoría de Seguridad (Logs)",
        "SLA Garantizado 99.9%"
      ],
      buttonText: "LISTA DE ESPERA",
      href: "#",
      active: false,
      icon: <Shield className="w-5 h-5 text-zinc-500" />
    }
  ]

  return (
    <section className="py-32 bg-[#09090b] relative overflow-hidden" id="precios">
      
      {/* 🌌 ATMÓSFERA GEMINIZADA DE FONDO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-900/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* TITULAR */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Early Access v1.0
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Elige tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Nivel de Control.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-light">
            Comienza con una prueba de concepto sin riesgos. Escala cuando estés listo.
          </p>
        </div>

        {/* GRILLA DE TARJETAS */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <div key={i} className={`
              relative p-8 rounded-[32px] border flex flex-col transition-all duration-500 group
              ${plan.active 
                ? 'bg-gradient-to-b from-zinc-900 via-zinc-900/80 to-black border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] scale-105 z-10' 
                : 'bg-zinc-900/20 border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-700 grayscale hover:grayscale-0'
              }
            `}>
              
              {/* BRILLO SUPERIOR PARA LA ACTIVA */}
              {plan.active && (
                 <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
              )}

              <div className="mb-8 relative">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${plan.active ? 'bg-emerald-500/10' : 'bg-zinc-800/50'}`}>
                        {plan.icon}
                    </div>
                    {plan.active && (
                        <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                            Disponible
                        </span>
                    )}
                </div>

                <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${plan.active ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {plan.name}
                </h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`text-4xl font-light ${plan.active ? 'text-white' : 'text-zinc-300'}`}>{plan.price}</span>
                  <span className="text-sm text-zinc-500 font-mono">{plan.period}</span>
                </div>
                
                <p className="text-sm text-zinc-400 leading-relaxed border-t border-dashed border-zinc-800 pt-4">
                    {plan.description}
                </p>
              </div>

              {/* FEATURES */}
              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-0.5 rounded-full ${plan.active ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              {/* BOTÓN DE ACCIÓN */}
              {plan.active ? (
                <Link href={plan.href} className="w-full">
                    <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95">
                        {plan.buttonText}
                    </Button>
                </Link>
              ) : (
                <Button disabled className="w-full h-14 bg-zinc-800/50 text-zinc-500 border border-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl cursor-not-allowed">
                    <Lock className="mr-2 w-3 h-3" /> {plan.buttonText}
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-center text-zinc-600 text-[10px] uppercase tracking-widest mt-16 font-mono">
          * Los planes PRO y Enterprise se habilitarán progresivamente.
        </p>

      </div>
    </section>
  )
}