import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  return (
    <div className={`flex w-full justify-center items-baseline font-sans select-none ${size} ${className}`}>
      {/* Parte 1: TURNO - Estilo "Gemini" (Peso medio/regular, limpio) */}
      {/* Cambio clave: de font-semibold a font-medium para ese contraste elegante */}
      <span className="text-white font-medium tracking-tighter mr-[2px]">
        Turno
      </span>
      
      {/* Parte 2: AQUI - Estilo Potente (Peso Black) */}
      <span className="text-emerald-500 font-black tracking-tighter flex items-baseline">
        Aqu
        
        {/* Parte 3: La 'i' Rayo (Diseño original nodrizo) */}
        {/* Ajuste fino: translate-y para anclarlo a la base visual */}
        <div className="relative w-[0.3em] h-[1.1em] ml-[0.05em] translate-y-[0.15em]">
           <svg
            viewBox="0 0 135 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* PUNTO: Rombo */}
            <path 
              d="M67.5 0 L115 47.5 L67.5 95 L20 47.5 Z" 
              fill="currentColor" 
            />
            
            {/* CUERPO: Rayo afilado */}
            <path 
              d="M35 110 H105 L75 160 H115 L20 240 L45 170 H10 L35 110 Z" 
              fill="currentColor" 
            />
          </svg>
        </div>
      </span>
    </div>
  );
};