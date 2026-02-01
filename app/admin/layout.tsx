import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Outfit } from "next/font/google"; // <--- LA FUENTE DE "TEAM"

// Configuramos la fuente igual que en tu página de Team
const outfit = Outfit({ subsets: ["latin"] });

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();
  
  // 1. Verificación de Seguridad (Igual que antes)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificamos permisos con la vista segura
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single();

  if (!adminData) {
    redirect('/login'); 
  }

  return (
    // Aplicamos la clase de la fuente (outfit.className) y los colores oscuros
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-emerald-500/30 ${outfit.className}`}>
      
      {/* 🟢 AURA ESMERALDA (La misma de la página Team) */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* MENÚ LATERAL (Sidebar) */}
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      {/* Le damos margen a la izquierda (pl-64) para respetar el menú */}
      <main className="pl-64 relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-8 md:p-10">
          {children}
        </div>
      </main>
      
    </div>
  );
}