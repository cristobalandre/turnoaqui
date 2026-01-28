"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const outfit = Outfit({ subsets: ["latin"] });

// 🖼️ TUS IMÁGENES DE FONDO
// Asegúrate de guardar tus archivos en la carpeta 'public' con estos nombres exactos:
const heroImages = [
  "/fondo1.png", 
  "/fondo2.png",
  "/fondo3.png"
];

export default function HomeLanding() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ⏱️ Lógica del Carrusel (Cambio cada 10 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 10000); // 10000ms = 10 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 selection:bg-emerald-500/30 ${outfit.className} overflow-x-hidden relative`}>
      
      {/* --- 1. FONDO DINÁMICO (CARRUSEL) --- */}
      <div className="fixed inset-0 z-0">
        {/* Renderizamos las imágenes con transición suave */}
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}

        {/* --- 2. CAPA "GLASS AHUMADO" (GEMINIZADO) --- */}
        {/* Overlay oscuro para que el texto resalte sobre cualquier foto */}
        <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[2px]" />
        
        {/* Gradiente sutil esmeralda para el "vibe" tecnológico */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/50" />
      </div>

      {/* --- 3. ILUMINACIÓN AMBIENTAL (AURA ORIGINAL) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full opacity-60" />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0F1112]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Logo en la barra (Pequeño) */}
            <Logo size="text-4xl" />
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Características</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Seguridad</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/calendar" className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <span>Ingresar</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (CONTENIDO) --- */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          TurnoAquí v1.0 - Consola de Operaciones
        </div>

        {/* LOGO GRANDE EN EL HERO (Se ve increíble sobre el fondo ahumado) */}
        <div className="mb-8 drop-shadow-2xl">
           <Logo size="text-6xl md:text-8xl" />
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl mb-8 leading-[1.1] drop-shadow-lg">
          Gestiona tu estudio <br />
          <span className="text-gray-400">sin ruido visual.</span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link 
            href="/calendar" 
            className="h-14 px-10 rounded-2xl bg-white text-black font-black flex items-center justify-center hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest hover:scale-105 active:scale-95"
          >
            Entrar a la Consola
          </Link>
        </div>
      </main>
    </div>
  );
}