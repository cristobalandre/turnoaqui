import React from "react";

interface LogoProps {
  size?: string; // Mantenemos la prop para compatibilidad, aunque la imagen define su propia proporción
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => {
  return (
    <div className={`flex w-full justify-center items-center ${className}`}>
      {/* Cargamos tu imagen PNG original.
         Asegúrate de que el archivo esté en 'public/logo.png' 
      */}
      <img
        src="/logo.png" 
        alt="TurnoAqui Logo"
        className="h-24 w-auto object-contain select-none transition-transform hover:scale-105 duration-500"
        style={{
          // 🪄 LA MAGIA: Esto crea el aura y la sombra sobre el PNG transparente
          // 1. drop-shadow verde: El aura esmeralda brillante
          // 2. drop-shadow negro: La sombra de profundidad para que flote
          filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.6)) drop-shadow(0 10px 10px rgba(0, 0, 0, 0.8))"
        }}
      />
    </div>
  );
};