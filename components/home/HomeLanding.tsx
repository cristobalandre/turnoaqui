"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowRight, LogOut, Chrome, User } from "lucide-react"; // ✅ Nuevos íconos agregados
import { Logo } from "@/components/ui/Logo";

const outfit = Outfit({ subsets: ["latin"] });

// 🖼️ TUS IMÁGENES DE FONDO (Intacto)
const heroImages = [
  "/fondo1.png", 
  "/fondo2.png",
  "/fondo3.png"
];

export default function HomeLanding() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 👤 1. ESTADO DE USUARIO (NUEVO)
  const [user, setUser] = useState<{ name: string } | null>(null);

  // ⏱️ Lógica del Carrusel (Intacto)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  // 🎲 2. FUNCIONES DE LOGIN/LOGOUT (NUEVO)
  const handleLogin = () => {
    const nombres = ["Chris", "Juan", "Ana", "Sofía", "Carlos"];
    const randomName = nombres[Math.floor(Math.random() * nombres.length)];
    setUser({ name: randomName });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 selection:bg-emerald-500/30 ${outfit.className} overflow-x-hidden relative`}>
      
      {/* --- 1. FONDO DINÁMICO (CARRUSEL) --- (Intacto) */}
      <div className="fixed inset-0 z-0">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        {/* Capas Glass (Intacto) */}
        <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/50" />
      </div>

      {/* --- 3. ILUMINACIÓN AMBIENTAL (Intacto) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full opacity-60" />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0F1112]/60 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          
          {/* LADO IZQUIERDO: LOGO */}
          <div className="flex items-center gap-3">
             {/* Ajusté a text-3xl porque text-5xl en el navbar se vería gigante y rompería el diseño */}
            <Logo size="text-4xl" />
          </div>

          {/* LADO DERECHO: LÓGICA DINÁMICA */}
          <div className="flex items-center gap-6">
            
            {/* 🔥 CONDICIONAL: SI HAY USUARIO MOSTRAR SALUDO, SI NO, MOSTRAR LO DE SIEMPRE */}
            {user ? (
              // ✅ MODO USUARIO (NUEVO)
              <>
                <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-300 animate-in fade-in slide-in-from-top-2 duration-700">
                  <span>¿Qué haremos hoy,</span>
                  <span className="text-emerald-400 font-bold capitalize">{user.name}</span>?
                </div>
                
                <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                <button 
                  onClick={handleLogout} 
                  className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                  <span className="hidden sm:block">Salir</span>
                </button>
                
                {/* Avatar con inicial */}
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs select-none shadow-lg shadow-emerald-500/20">
                    {user.name.charAt(0)}
                </div>
              </>
            ) : (
              // ❌ MODO VISITANTE (TU CÓDIGO ORIGINAL INTACTO)
              <>
                <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
                  <a href="#features" className="hover:text-emerald-400 transition-colors">Características</a>
                  <a href="#security" className="hover:text-emerald-400 transition-colors">Seguridad</a>
                </div>

                <div className="flex items-center gap-3">
                   {/* Agregué este botón de Google extra para dar opción rápida */}
                   <button onClick={handleLogin} className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white group" title="Ingresar con Google">
                      <Chrome className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                   </button>

                   {/* Tu botón original, ahora activa el login simulado */}
                   <button onClick={handleLogin} className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
                    <span>Ingresar</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (CONTENIDO) --- */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        
        {/* CONDICIONAL DEL BADGE/ETIQUETA */}
        {user ? (
           <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md animate-pulse">
             <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
             Sesión activa de {user.name}
           </div>
        ) : (
           // TU BADGE ORIGINAL
           <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            TurnoAquí v1.0 - Consola de Operaciones
          </div>
        )}

        {/* LOGO GRANDE (Intacto) */}
        <div className="mb-8 drop-shadow-2xl">
           <Logo size="text-6xl md:text-8xl" />
        </div>

        {/* CONDICIONAL DEL TÍTULO H1 */}
        <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl mb-8 leading-[1.1] drop-shadow-lg">
          {user ? (
            <>Bienvenido de vuelta, <span className="text-emerald-400">{user.name}.</span></>
          ) : (
            // TU TÍTULO ORIGINAL
            <>
              Gestiona tu estudio <br />
              <span className="text-gray-400">sin ruido visual.</span>
            </>
          )}
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link 
            href="/calendar" 
            className="h-14 px-10 rounded-2xl bg-white text-black font-black flex items-center justify-center hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest hover:scale-105 active:scale-95"
          >
            {user ? "Ir a mi Calendario" : "Entrar a la Consola"}
          </Link>
        </div>
      </main>
    </div>
  );
}