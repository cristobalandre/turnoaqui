import React from 'react';

// ⚡ Componente interno para la "í" con rayo
const LightningI = () => (
  <svg
    // Un viewBox alto para que quepa el acento
    viewBox="0 0 16 36" 
    fill="currentColor"
    // Ajustes finos de posición para que se alinee con el texto itálico
    className="h-[1.1em] w-auto inline-block -translate-y-[0.1em] -ml-[0.05em]"
    style={{ transform: 'skewX(-10deg)' }} // Un extra de inclinación para el rayo
    aria-hidden="true"
  >
    {/* La parte del RAYO (el acento) */}
    <path d="M8.5 0L1.5 11H6.5L3.5 20L14.5 9H8.5L11.5 0H8.5Z" />
    {/* La base de la letra 'i' */}
    <path d="M4 24L6 13H12L10 24H4Z" />
  </svg>
);

export const Logo = ({ size = "text-4xl" }: { size?: string }) => {
  return (
    <h1 className={`${size} font-light tracking-tighter text-white select-none flex items-baseline justify-center`}>
      Turno
      {/* Usamos inline-flex para alinear perfectamente el SVG con el texto */}
      <span className="text-emerald-500 font-bold italic ml-0.5 inline-flex items-baseline">
        Aqu
        {/* Reemplazamos la 'í' de texto por nuestro gráfico */}
        <LightningI />
      </span>
    </h1>
  );
};