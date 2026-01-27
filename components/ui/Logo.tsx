import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  return (
    // Contenedor externo para centrado general en la página
    <div className={`flex w-full justify-center ${className}`}>
      
       {/* ✅ NUEVO CONTENEDOR: EFECTO GLASS AHUMADO FLOTANTE */}
       <div className={`
         relative inline-flex items-baseline gap-[2px]           // Alineación interna
         px-10 py-5 rounded-[30px]                               // Espaciado y bordes curvos suaves
         bg-[#09090b]/60 backdrop-blur-2xl                       // EFECTO VIDRIO: Fondo oscuro semi-transparente + desenfoque potente
         border border-white/10 border-t-white/20                // Bordes sutiles de cristal (arriba un poco más claro para dar volumen)
         shadow-2xl shadow-black/50                              // SOMBRA PROFUNDA para el efecto flotante
         ${size}                                                 // El tamaño se aplica al contenedor
         transition-all duration-500 group hover:scale-[1.02] hover:shadow-emerald-500/10 // Pequeña animación al pasar el mouse
       `}>

        {/* --- CONTENIDO DEL LOGO (Intacto) --- */}
        {/* Parte 1: TURNO (Blanco, peso Medium - Limpio) */}
        <span className="text-white font-medium tracking-tight select-none relative z-10">
          Turno
        </span>
        
        {/* Parte 2: AQU (Esmeralda, peso Bold/Black) */}
        <span className="text-emerald-500 font-bold tracking-tight flex items-baseline select-none relative z-10">
          Aqu
          
          {/* La 'i' Rayo */}
          <div className="relative w-[0.55em] h-[1.4em] -ml-[0.02em] translate-y-[0.2em]">
             <svg
              viewBox="0 0 135 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path d="M67.5 0 L115 42 L67.5 84 L20 42 Z" fill="currentColor" />
              <path fill="currentColor" d="M30 100 H105 L75 155 H120 L35 240 L60 170 H15 Z" />
            </svg>
          </div>
        </span>
         {/* --- FIN CONTENIDO DEL LOGO --- */}

        {/* Decoración extra: Un sutil destello esmeralda en el fondo del cristal */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent rounded-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      </div>
    </div>
  );
};