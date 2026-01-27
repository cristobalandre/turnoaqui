import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowRight, Mic2, Play, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });

export default function LandingPage() {
  return (
    <div className={`min-h-screen bg-[#0F1112] text-gray-100 selection:bg-emerald-500/30 ${outfit.className} overflow-x-hidden`}>
      
      {/* --- ILUMINACIÓN AMBIENTAL (Sobria y Elegante) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen opacity-60" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-[#0F1112]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <Mic2 className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Studio<span className="text-gray-500">Manager</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Características</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Seguridad</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Planes</a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link 
              href="/login" 
              className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
            >
              <span className="mr-2">Empezar ahora</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10">
          <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sistema operativo para estudios v2.0
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-7xl mb-8 leading-[1.1]">
          Gestiona tu estudio <br />
          <span className="text-gray-500">sin ruido visual.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-gray-400 mb-12 leading-relaxed font-light">
          Una plataforma seria para profesionales del audio. Centraliza reservas, 
          ingenieros y facturación en una interfaz diseñada para no distraerte.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link 
            href="/login" 
            className="h-12 px-8 rounded-xl bg-white text-black font-semibold flex items-center justify-center hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Crear cuenta gratis
          </Link>
          <button className="h-12 px-8 rounded-xl border border-white/10 bg-transparent text-white font-medium flex items-center justify-center hover:bg-white/5 transition-all gap-2">
            <Play className="h-4 w-4 fill-white" /> Ver Demo de 1 min
          </button>
        </div>

        {/* --- UI PREVIEW --- */}
        <div className="relative mx-auto max-w-6xl">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-emerald-500/5 blur-[80px] rounded-full"></div>
           
           <div className="relative rounded-xl border border-white/10 bg-[#151719] shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1A1D1F]">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                </div>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Dashboard</div>
                <div className="w-10"></div>
             </div>

             <div className="aspect-[16/9] w-full bg-[#0F1112] relative flex flex-col items-center justify-center group overflow-hidden">
                <div className="absolute inset-0 bg-[url('/login-bg-dark.png')] bg-cover bg-center opacity-30 grayscale transition-all duration-1000 group-hover:opacity-50 group-hover:scale-105"></div>
                
                <div className="z-10 bg-[#1A1D1F]/90 border border-white/5 p-6 rounded-2xl backdrop-blur-md shadow-2xl transform transition-transform group-hover:-translate-y-2">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                         <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                         <div className="text-sm font-medium text-white">Reserva Confirmada</div>
                         <div className="text-xs text-gray-500">Sesión de Grabación - Studio A</div>
                      </div>
                   </div>
                   <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-emerald-500 rounded-full"></div>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* --- CARACTERÍSTICAS --- */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
           {[
             { icon: Zap, title: "Velocidad", desc: "Interfaz optimizada para cargar en milisegundos. Sin animaciones innecesarias." },
             { icon: ShieldCheck, title: "Seguridad", desc: "Tus datos y los de tus artistas están encriptados con estándares bancarios." },
             { icon: Mic2, title: "Audio First", desc: "Gestiona archivos, stems y maquetas directamente desde la reserva." }
           ].map((feature, i) => (
             <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <feature.icon className="h-8 w-8 text-emerald-500 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
             </div>
           ))}
        </div>

      </main>
    </div>
  );
}