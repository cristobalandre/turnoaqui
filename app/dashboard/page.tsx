"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Outfit } from "next/font/google";
import { 
  LogOut, LayoutGrid, Calendar, Box, Users, Settings, ArrowRight, 
  Music2, PlayCircle, Layers, Shield, Scissors
} from "lucide-react";

const outfit = Outfit({ subsets: ["latin"] });
const supabase = createClient();

// 📸 TUS NUEVAS FOTOS DE ARTE (Guárdalas en 'public' con estos nombres)
const studioImages = [
  "/art-1.jpg",
  "/art-2.jpg",
  "/art-3.jpg"
];

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500">Cargando Studio...</div>;

  const isAdmin = profile?.role === 'admin';

  return (
    <div className={`min-h-screen bg-[#050505] text-zinc-100 ${outfit.className} overflow-x-hidden selection:bg-emerald-500/30`}>
      
      {/* 🎨 FONDO SUTIL (Geminizado limpio) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      {/* 🎞️ CORREDOR DE FOTOS (Marquee Horizontal Artístico) */}
      <div className="relative z-10 w-full h-48 md:h-64 overflow-hidden border-b border-white/5 bg-zinc-900/50">
        <div className="absolute inset-0 flex items-center animate-marquee gap-0">
             {/* Duplicamos el array 4 veces para asegurar que cubra pantallas grandes sin cortes */}
             {[...studioImages, ...studioImages, ...studioImages, ...studioImages].map((src, i) => (
                <div key={i} className="relative w-[300px] md:w-[500px] h-full flex-shrink-0 group overflow-hidden border-r border-white/5 bg-black">
                    {/* Placeholder visual por si la imagen aún no existe */}
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-800 text-xs font-bold uppercase tracking-widest">
                        {src}
                    </div>
                    <Image 
                        src={src} 
                        alt="Studio Art" 
                        fill 
                        className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                        onError={(e) => {
                            // Si falla la carga, ocultamos la imagen rota para mantener la estética
                            (e.target as HTMLImageElement).style.opacity = '0';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                </div>
             ))}
        </div>
        {/* Overlay Texto Flotante */}
        <div className="absolute bottom-6 left-6 md:left-12 z-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-xl">
                Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Hub</span>
            </h2>
        </div>
      </div>

      <nav className="relative z-20 px-6 md:px-12 py-6 flex justify-between items-center border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0">
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">T</div>
            <span className="font-medium text-zinc-400">Bienvenido, <span className="text-white">{profile?.full_name?.split(' ')[0]}</span></span>
         </div>
         <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors"><LogOut size={18} /></button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-12">
        
        {/* GRID PRINCIPAL (Diseño limpio vectorial) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* 1. STUDIO HUB (Tarjeta Principal) */}
          <Link href="/projects" className="col-span-1 md:col-span-2 group">
            <div className="relative h-64 md:h-80 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden shadow-2xl group-hover:shadow-emerald-900/20">
              {/* Vector de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-transform duration-700 group-hover:scale-110">
                  <LayoutGrid size={200} className="text-white" />
              </div>

              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Music2 size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Proyectos & Mezclas</h3>
                    <p className="text-zinc-400 max-w-md text-sm">Accede a tus sesiones, gestiona versiones y colabora en tiempo real.</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    Abrir Sala <ArrowRight size={14} />
                  </div>
              </div>
            </div>
          </Link>

          {/* 2. CALENDARIO */}
          <Link href="/calendar" className="group">
            <div className="relative h-64 md:h-80 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden flex flex-col justify-between p-8 group-hover:shadow-cyan-900/20">
               <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div>
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300 mb-4 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      <Calendar size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Calendario</h3>
               </div>
               
               <div className="space-y-3">
                   {[1,2,3].map(i => (
                       <div key={i} className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                           <div className="h-full bg-zinc-800 w-2/3 group-hover:bg-cyan-500/50 transition-colors" style={{width: `${80 - (i*20)}%`}} />
                       </div>
                   ))}
                   <p className="text-xs text-zinc-500 pt-2">Ver agenda completa</p>
               </div>
            </div>
          </Link>
        </div>

        {/* BARRA INFERIOR MINIMALISTA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { name: "Recursos", icon: Box, link: "/resources" },
             { name: "Staff", icon: Users, link: "/admin/team" },
             { name: "Servicios", icon: Scissors, link: "/services" },
             ...(isAdmin ? [{ name: "Admin", icon: Shield, link: "/admin/team" }] : [])
           ].map((item) => (
             <Link href={item.link} key={item.name}>
               <div className="h-24 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:bg-zinc-900 hover:border-white/10 transition-all flex flex-col items-center justify-center gap-2 group">
                 <item.icon className="text-zinc-500 group-hover:text-white transition-colors" size={20} />
                 <span className="text-sm font-medium text-zinc-400 group-hover:text-white">{item.name}</span>
               </div>
             </Link>
           ))}
        </div>

      </main>
      
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); } /* Ajuste para scroll infinito suave */
        }
        .animate-marquee {
          animation: marquee 80s linear infinite;
        }
      `}</style>
    </div>
  );
}