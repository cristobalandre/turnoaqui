import React from 'react';

export const Logo = ({ size = "text-4xl" }: { size?: string }) => {
  return (
    <h1 className={`${size} font-light tracking-tighter text-white select-none`}>
      Turno
      <span className="text-emerald-500 font-bold italic ml-px">
        Aquí
      </span>
    </h1>
  );
};