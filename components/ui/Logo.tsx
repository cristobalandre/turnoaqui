import Image from "next/image";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

interface LogoProps {
  /**
   * Clases para el contenedor externo. Úsalo para márgenes (mt-4) o posicionamiento.
   */
  className?: string;
  /**
   * Define el ANCHO exacto del logo.
   * Usa clases de Tailwind como 'w-32', 'w-40', 'w-[150px]', etc.
   * Por defecto es 'w-48' (tamaño medio).
   */
  widthClass?: string;
}

export const Logo = ({
  className = "",
  widthClass = "w-48", // Valor por defecto equilibrado
}: LogoProps) => {
  return (
    // Contenedor principal (para márgenes externos si se necesitan)
    <div className={`flex items-center ${outfit.className} ${className}`}>
      
      {/*
        CONTENEDOR DEL TAMAÑO:
        Aquí se aplica el 'widthClass' que tú decidas.
        La altura se ajustará automáticamente (h-auto en la imagen).
      */}
      <div className={`relative ${widthClass} flex items-center justify-center transition-transform duration-500 hover:scale-105`}>
         <Image
           src="/logo.svg"
           alt="TurnoAquí Logo"
           // Estos valores son para que Next sepa el aspect ratio original,
           // no el tamaño final en pantalla. Asegúrate de que coincidan con tu SVG real.
           width={400}
           height={100}
           // 'h-auto w-full' hace que la imagen llene el contenedor 'widthClass'.
           // El drop-shadow es el AURA. Al ser shadow, no distorsiona el layout vecino.
           className="h-auto w-full drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
           priority
         />
      </div>
    </div>
  );
};