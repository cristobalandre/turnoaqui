import React from 'react';

// 📐 Gráfico geométrico: Acento superior + Cuerpo de rayo con base recta
const LightningI = () => (
  <svg
    viewBox="0 0 20 42" 
    fill="currentColor"
    // Alineación óptica para que encaje con la tipografía bold italic
    className="h-[1.2em] w-auto inline-block -translate-y-[0.18em] -ml-[0.05em]"
    style={{ transform: 'skewX(-11deg)' }} 
    aria-hidden="true"
  >
    {/* 1. ACENTO SUPERIOR (Diamante preciso) */}
    <path d="M10 0L15 5L10 10L5 5L10 0Z" />
    
    {/* 2. CUERPO DE RAYO (Base recta y punta final) */}
    {/* M7 13 (Base recta arriba) -> H13 (Ancho) -> L11 24 (Quiebre) -> H16 (Extensión) -> L4 42 (Punta final) -> L7 28 (Retorno) -> H3 (Cierre) */}
    <path d="M6 13H14L11 25H17L4 42L8 28H3L6 13Z" />
  </svg>
);

export const Logo = ({ size = "text-4xl" }: { size?: string }) => {
  return (
    <h1 className={`${size} font-light tracking-tighter text-white select-none flex items-baseline`}>
      Turno
      <span className="text-emerald-500 font-bold italic ml-0.5 inline-flex items-baseline">
        Aqu
        <LightningI />
      </span>
    </h1>
  );
};