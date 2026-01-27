import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  return (
    <div className={`flex w-full justify-center items-baseline font-sans select-none ${size} ${className}`}>
      {/* Contenedor relativo para la línea debajo de TURNO */}
      <div className="relative flex items-baseline">
        
        {/* Parte 1: TURNO (Blanco, peso Medium - Estilo Gemini limpio) */}
        <span className="text-white font-medium tracking-tighter mr-[2px] z-10">
          Turno
        </span>

        {/* Línea verde degradada debajo de Turno */}
        <div className="absolute -bottom-2 left-0 w-full h-[0.1em] bg-gradient-to-r from-emerald-500 to-transparent opacity-80 rounded-full" />
      </div>
      
      {/* Parte 2: AQU (Esmeralda, peso Black - Potente) */}
      <span className="text-emerald-500 font-black tracking-tighter flex items-baseline ml-[1px]">
        Aqu
        
        {/* Parte 3: La 'i' Rayo (Réplica exacta de yiaaaaaa.png) */}
        {/* Aumentamos altura a 1.5em para que el rombo suba y la cola baje */}
        <div className="relative w-[0.6em] h-[1.5em] -ml-[0.05em] translate-y-[0.15em]">
           <svg
            viewBox="0 0 135 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* PUNTO: Rombo (Alineado a la altura de la mayúscula) */}
            <path 
              d="M68 0 L115 45 L68 90 L21 45 Z" 
              fill="currentColor" 
            />
            
            {/* CUERPO: Rayo Vectorizado (Cola larga y agresiva) */}
            <path 
              fill="currentColor" 
              d="
                M30 105       /* Inicio cuerpo (dejando espacio bajo el rombo) */
                H100          /* Ancho superior robusto */
                L75 160       /* Corte diagonal interno */
                H120          /* Saliente derecha */
                L40 240       /* PUNTA FINAL (Bien abajo) */
                L65 175       /* Corte diagonal retorno */
                H20           /* Saliente izquierda */
                Z             /* Cierre */
              "
            />
          </svg>
        </div>
      </span>
    </div>
  );
};