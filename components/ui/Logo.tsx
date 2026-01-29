import Image from "next/image";
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
      {/* El 'widthClass' controla el tamaño de esta caja invisible.
         La imagen de adentro simplemente se adapta a esta caja.
      */}
      <div className={`relative ${widthClass} flex items-center justify-center transition-transform duration-500 hover:scale-105`}>
         <Image
           src="/logo.png" 
           alt="TurnoAquí Logo"
           width={0}
           height={0}
           sizes="100vw"
           // w-full hace que llene el widthClass, h-auto mantiene la proporción
           className="h-auto w-full object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
           priority
         />
      </div>
    </div>
  );
};