import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  return (
    <div className={`flex w-full justify-center items-baseline font-sans select-none ${size} ${className}`}>
      {/* Parte 1: TURNO (Blanco, peso Medium - Limpio) */}
      <span className="text-white font-medium tracking-tight mr-[1px]">
        Turno
      </span>
      
      {/* Parte 2: AQU (Esmeralda, peso Bold/Black) */}
      <span className="text-emerald-500 font-bold tracking-tight flex items-baseline ml-[1px]">
        Aqu
        
        {/* Parte 3: La 'i' Rayo (Réplica exacta de yiaaaaaa.png) */}
        {/* - w-[0.55em]: Ancho para igualar el grosor de la 'u'.
           - h-[1.4em]: Alto para que el rombo llegue arriba y la cola baje.
           - translate-y-[0.2em]: Baja el rayo para que actúe como una 'j' o 'q'.
        */}
        <div className="relative w-[0.55em] h-[1.4em] -ml-[0.02em] translate-y-[0.2em]">
           <svg
            viewBox="0 0 135 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* PUNTO: Rombo Perfecto */}
            <path 
              d="M67.5 0 L115 42 L67.5 84 L20 42 Z" 
              fill="currentColor" 
            />
            
            {/* CUERPO: Rayo estilo 'Z' afilada (Geometría exacta) */}
            <path 
              fill="currentColor" 
              d="
                M30 100       /* Inicio cuerpo superior izq */
                H105          /* Línea recta superior */
                L75 155       /* Diagonal hacia el centro */
                H120          /* Saliente hacia la derecha */
                L35 240       /* PUNTA DE LA COLA (Bien profunda y afilada) */
                L60 170       /* Diagonal de retorno */
                H15           /* Saliente hacia la izquierda */
                Z             /* Cierre */
              "
            />
          </svg>
        </div>
      </span>
    </div>
  );
};