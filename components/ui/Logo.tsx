import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-5xl", className = "" }: LogoProps) => {
  // 📏 MAPA DE TAMAÑOS INTELIGENTE
  // Convertimos las clases de texto antiguas a alturas de imagen exactas
  const heightMap: Record<string, string> = {
    "text-2xl": "h-8",   // Para Modales (Pequeño ~32px)
    "text-3xl": "h-10",  // Intermedio
    "text-4xl": "h-12",  // Para Header/Barra Superior (~48px)
    "text-5xl": "h-64",  // 💥 PARA EL HERO/PORTADA (Gigante ~256px)
  };

  // Si pasan un tamaño que no está en el mapa, usamos h-64 (Gigante) por defecto
  const imageHeight = heightMap[size] || "h-64";

  return (
    <div className={`flex w-full justify-center items-center ${className}`}>
      <img
        src="/logo.png" 
        alt="TurnoAqui Logo"
        // Aplicamos la altura dinámica (imageHeight) y w-auto para que no se deforme
        className={`${imageHeight} w-auto object-contain select-none transition-transform hover:scale-105 duration-500`}
        style={{
          // Filtros de alta calidad para el efecto "Aura"
          filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.5)) drop-shadow(0 15px 15px rgba(0, 0, 0, 0.8))"
        }}
      />
    </div>
  );
};