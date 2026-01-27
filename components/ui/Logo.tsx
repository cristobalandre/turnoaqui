import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-4xl", className = "" }: LogoProps) => {
  return (
    <div className={`flex items-baseline font-black tracking-tighter select-none ${size} ${className}`}>
      {/* Parte 1: TURNO (Blanco) */}
      <span className="text-white tracking-tight">Turno</span>
      
      {/* Parte 2: AQU (Esmeralda) */}
      <span className="text-emerald-500 flex items-baseline tracking-tight ml-[1px]">
        Aqu
        
        {/* Parte 3: La 'í' modificada (Rayo) */}
        {/* Ajustamos 'translate-y' para bajarlo y que encaje con la base de la 'q' */}
        <div className="relative w-[0.4em] h-[0.9em] ml-[0.05em] translate-y-[0.12em]">
           <svg
            viewBox="0 0 24 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* El punto de la i (Rombo) */}
            <path d="M12 0L20 8L12 16L4 8L12 0Z" fill="currentColor" />
            
            {/* El cuerpo de la i (Rayo afilado hacia abajo) */}
            <path d="M14 19H2L10 29H4L18 46V33H24L14 19Z" fill="currentColor" />
          </svg>
        </div>
      </span>
    </div>
  );
};