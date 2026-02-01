"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Music, 
  Mic2, 
  Users, 
  Shield,
  LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/admin", icon: Calendar },
    { name: "Salas", href: "/admin/rooms", icon: Music },
    { name: "Productores", href: "/admin/productores", icon: Mic2 },
    { name: "Artistas", href: "/admin/artistas", icon: Users },
    { name: "Gestión Equipo", href: "/admin/team", icon: Shield },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="w-64 h-screen bg-[#09090b]/95 border-r border-zinc-800/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50">
      
      {/* LOGO */}
      <div className="p-8 border-b border-zinc-800/30">
        <h1 className="text-2xl font-bold text-white tracking-tighter">
          Studio<span className="text-emerald-500">Hub</span>
        </h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-medium">Panel de Control</p>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          // Lógica exacta para saber si está activo
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                ${isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                }
              `}
            >
              <item.icon 
                size={18} 
                className={`transition-colors ${isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-300"}`} 
              />
              <span className={`font-medium text-sm tracking-wide ${isActive ? "font-semibold" : ""}`}>
                {item.name}
              </span>
              
              {/* Indicador brillante activo */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-zinc-800/30 bg-zinc-900/20">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all text-xs font-bold tracking-wider group"
        >
          <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
          <span>CERRAR SESIÓN</span>
        </button>
      </div>
    </div>
  );
}