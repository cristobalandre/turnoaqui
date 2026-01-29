"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const outfit = Outfit({ subsets: ["latin"] });

export default function PrivacyPage() {
  return (
    <div className={`min-h-screen bg-[#0F1112] text-zinc-300 py-20 px-6 ${outfit.className}`}>
      
      {/* Botón Volver */}
      <div className="max-w-4xl mx-auto mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado */}
        <div className="mb-16 text-center border-b border-white/5 pb-12">
          <div className="flex justify-center mb-6">
            <Logo size="text-4xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Política de Privacidad</h1>
          <p className="text-zinc-500">Última actualización: 28 de Enero, 2026</p>
        </div>

        {/* Contenido Legal */}
        <div className="space-y-12 text-sm leading-relaxed text-justify">
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> 1. Introducción
            </h2>
            <p>
              En <strong>TurnoAquí</strong> ("nosotros", "nuestro"), nos comprometemos a proteger tu privacidad. 
              Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información cuando utilizas 
              nuestra plataforma de gestión para estudios de grabación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">2. Información que Recopilamos</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong>Datos de Cuenta:</strong> Nombre completo, correo electrónico, número de teléfono y foto de perfil.</li>
              <li><strong>Datos de Autenticación:</strong> ID de usuario de Google y correo asociado (al usar Google Login).</li>
              <li><strong>Datos del Proyecto:</strong> Archivos de audio subidos, notas de sesión, fechas de reserva y estado de pagos.</li>
              <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de navegador y patrones de uso para mejorar la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">3. Uso de la Información</h2>
            <p className="mb-4">Utilizamos tu información para los siguientes fines:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Proporcionar y mantener el servicio de TurnoAquí.</li>
              <li>Procesar reservas y gestionar el calendario del estudio.</li>
              <li>Facilitar la comunicación entre estudios y clientes (ej: confirmaciones por WhatsApp/Email).</li>
              <li>Mejorar la seguridad y prevenir fraudes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">4. Compartir Información</h2>
            <p>
              No vendemos tus datos personales. Solo compartimos información con proveedores de servicios esenciales 
              para operar la plataforma (como Supabase para base de datos y autenticación, o servicios de almacenamiento en la nube).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas (encriptación, control de acceso) para proteger tus datos. 
              Sin embargo, ningún método de transmisión por Internet es 100% seguro, por lo que usas el servicio bajo tu propio riesgo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">6. Tus Derechos</h2>
            <p>
              Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. 
              Puedes gestionar tus datos desde tu panel de control o contactarnos para solicitar la eliminación de tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">7. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política, contáctanos en: <br />
              <a href="mailto:soporte@turnoaqui.com" className="text-emerald-400 hover:underline">soporte@turnoaqui.com</a>
            </p>
          </section>

        </div>

        {/* Footer del Documento */}
        <div className="mt-20 pt-10 border-t border-white/5 text-center text-xs text-zinc-600">
          <p>TurnoAquí © 2026 • Gestiona tu estudio sin ruido visual.</p>
        </div>

      </div>
    </div>
  );
}