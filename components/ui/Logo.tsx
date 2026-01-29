import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

interface LogoProps {
  /** Clases para el contenedor externo (márgenes, posición) */
  className?: string;
  /** Ancho del logo (ej: w-48, w-[150px]). Por defecto w-48 */
  widthClass?: string;
}

export const Logo = ({
  className = "",
  widthClass = "w-48",
}: LogoProps) => {
  return (
    <div className={`flex items-center ${outfit.className} ${className}`}>
      {/* Contenedor que controla el ancho */}
      <div className={`relative ${widthClass} flex items-center justify-center transition-transform duration-500 hover:scale-105`}>
         <img
           src="/logo.png" 
           alt="TurnoAquí Logo"
           // h-auto y w-full hacen que la imagen se adapte perfectamente al widthClass
           className="h-auto w-full object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
         />
      </div>
    </div>
  );
};