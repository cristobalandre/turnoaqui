import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  return (
    <div className={`flex w-full justify-center items-baseline font-sans select-none ${size} ${className}`}>
      {/* Parte 1: TURNO (Blanco, peso medio estilo Gemini) */}
      <span className="text-white font-medium tracking-tighter mr-[2px]">
        Turno
      </span>
      
      {/* Parte 2: AQU (Esmeralda, peso Black potente) */}
      <span className="text-emerald-500 font-black tracking-tighter flex items-baseline">
        Aqu
        
        {/* Parte 3: La 'i' Rayo (Réplica exacta de tu vector) */}
        {/* Bajamos el rayo ligeramente (translate-y) para anclarlo visualmente a la base */}
        <div className="relative w-[0.35em] h-[1.1em] ml-[0.05em] translate-y-[0.1em]">
           <svg
            viewBox="0 0 135 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* PUNTO: Rombo (Tal cual tu imagen) */}
            <path 
              d="M68 0 L115 45 L68 90 L21 45 Z" 
              fill="currentColor" 
            />
            
            {/* CUERPO: Rayo Vectorizado (Calcado de tu imagen image_088133.jpg) */}
            <path 
              fill="currentColor" 
              d="
                M30 100       /* Inicio Arriba Izquierda */
                H95           /* Línea Horizontal Superior */
                L70 155       /* Diagonal hacia abajo-derecha (el quiebre interno) */
                H115          /* Shelf/Estante hacia afuera derecha */
                L40 240       /* Diagonal larga hacia la punta inferior */
                L65 175       /* Diagonal hacia arriba (el quiebre interno izquierdo) */
                H20           /* Shelf/Estante hacia afuera izquierda */
                Z             /* Cierra la forma volviendo al inicio */
              "
            />
          </svg>
        </div>
      </span>
    </div>
  );
};