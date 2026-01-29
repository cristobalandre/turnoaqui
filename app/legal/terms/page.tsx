"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const outfit = Outfit({ subsets: ["latin"] });

export default function TermsPage() {
  return (
    <div className={`min-h-screen bg-[#0F1112] text-zinc-300 py-20 px-6 ${outfit.className}`}>
      
      <div className="max-w-4xl mx-auto mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        
        <div className="mb-16 text-center border-b border-white/5 pb-12">
          <div className="flex justify-center mb-6">
            <Logo widthClass="w-[145px]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Términos y Condiciones</h1>
          <p className="text-zinc-500">Última actualización: 28 de Enero, 2026</p>
        </div>

        <div className="space-y-12 text-sm leading-relaxed text-justify">
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> 1. Aceptación de los Términos
            </h2>
            <p>
              Al acceder o utilizar <strong>TurnoAquí</strong> ("el Servicio"), aceptas estar sujeto a estos Términos y Condiciones. 
              Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">2. Descripción del Servicio</h2>
            <p>
              TurnoAquí es una plataforma de gestión web diseñada para profesionales del audio (estudios de grabación, ingenieros de mezcla, productores). 
              El servicio facilita la gestión de reservas, clientes y archivos de proyectos. TurnoAquí es solo una herramienta y no garantiza resultados profesionales ni consultoría de audio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">3. Cuentas y Responsabilidad</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
              <li>Aceptas la responsabilidad de todas las actividades que ocurran bajo tu cuenta.</li>
              <li>Debes tener al menos 16 años para usar este servicio.</li>
              <li>TurnoAquí se reserva el derecho de cancelar cuentas que violen estos términos o realicen actividades sospechosas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">4. Propiedad Intelectual</h2>
            <p>
              <strong>Tu Contenido:</strong> Tú conservas la propiedad total de todo el contenido de audio y archivos que subas a TurnoAquí. 
              No reclamamos derechos de propiedad sobre tu trabajo.
            </p>
            <p className="mt-2">
              <strong>Nuestro Servicio:</strong> El software, diseño, logotipos y código de TurnoAquí son propiedad exclusiva de TurnoAquí y están protegidos por leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">5. Pagos y Suscripciones</h2>
            <p>
              Algunas funciones del servicio pueden ser de pago. Al suscribirte, aceptas pagar las tarifas indicadas. 
              Las tarifas no son reembolsables, excepto cuando lo exija la ley. Nos reservamos el derecho de modificar los precios con previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">6. Limitación de Responsabilidad</h2>
            <p>
              El servicio se proporciona "tal cual". TurnoAquí no será responsable por daños indirectos, incidentales o consecuentes 
              (incluyendo pérdida de datos o interrupción del negocio) que resulten del uso o la imposibilidad de usar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">7. Modificaciones</h2>
            <p>
              Podemos actualizar estos términos en cualquier momento. Te notificaremos sobre cambios importantes. 
              El uso continuado del servicio después de dichos cambios constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">8. Contacto</h2>
            <p>
              Si tienes dudas sobre estos términos, por favor contáctanos en: <br />
              <a href="mailto:soporte@turnoaqui.com" className="text-emerald-400 hover:underline">soporte@turnoaqui.com</a>
            </p>
          </section>

        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-center text-xs text-zinc-600">
          <p>TurnoAquí © 2026 • Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
}