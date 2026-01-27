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
        
        {/* Parte 1: TURNO (Blanco, peso medio) */}
        <span className="text-white font-medium tracking-tighter mr-[2px] z-10">
          Turno
        </span>

        {/* Línea verde degradada debajo de Turno */}
        <div className="absolute -bottom-2 left-0 w-full h-[0.1em] bg-gradient-to-r from-emerald-500 to-transparent opacity-80 rounded-full" />
      </div>
      
      {/* Parte 2: AQU (Esmeralda, peso Black) */}
      <span className="text-emerald-500 font-black tracking-tighter flex items-baseline ml-[1px]">
        Aqu
        
        {/* Parte 3: La 'i' Rayo (Ajustado: Más grande y con descender) */}
        {/* Aumentamos w y h para agrandarlo. Ajustamos translate-y para que la cola baje como una 'q' */}
        <div className="relative w-[0.5em] h-[1.3em] -ml-[0.05em] translate-y-[0.25em]">
           <svg
            viewBox="0 0 135 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* PUNTO: Rombo */}
            <path 
              d="M68 0 L115 45 L68 90 L21 45 Z" 
              fill="currentColor" 
            />
            
            {/* CUERPO: Rayo Vectorizado */}
            <path 
              fill="currentColor" 
              d="
                M30 100       
                H95           
                L70 155       
                H115          
                L40 240       
                L65 175       
                H20           
                Z             
              "
            />
          </svg>
        </div>
      </span>
    </div>
  );
};