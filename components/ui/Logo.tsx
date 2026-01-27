import React from "react";

interface LogoProps {
  size?: string;
  className?: string;
}

export const Logo = ({ size = "text-3xl", className = "" }: LogoProps) => {
  return (
    // Se cambió 'inline-flex' por 'flex' y se añadió 'justify-center' para centrarlo.
    <div className={`flex justify-center items-center font-black tracking-tighter select-none ${size} ${className}`}>
      <div className="relative">
        <span className="text-white">TURNO</span>
        {/* Se añadió 'translate-y-[3px]' para bajar el rayo y que encaje. */}
        <span className="text-emerald-500 ml-0.5 translate-y-[3px]">⚡</span>
        <span className="text-white">AQUÍ</span>
        {/* La línea inferior se mantiene igual. */}
        <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent rounded-full opacity-50" />
      </div>
    </div>
  );
};