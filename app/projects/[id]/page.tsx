"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { ArrowLeft, Download, CheckCircle2, Send, Loader2, Trash2, Share2, Check } from "lucide-react"; // Agregamos Share2 y Check
import { AudioPlayer, AudioPlayerRef } from "@/components/projects/AudioPlayer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectDetailPage() {
  const { id } = useParams(); 
  const router = useRouter(); 
  const supabase = createClient();
  const playerRef = useRef<AudioPlayerRef>(null);
  
  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [copied, setCopied] = useState(false); // Estado para el feedback de copiado

  // 1. EL PORTERO AUTOMÁTICO 🛡️
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn("⛔ ACCESO DENEGADO: Redirigiendo al Login...");
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href },
        });
        return;
      }

      setCurrentUser(session.user);

      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
         console.error("Error cargando proyecto:", error);
      } else {
         setProject(projectData);
         fetchComments();
      }
      
      setLoading(false);
    };

    checkSessionAndFetch();
  }, [id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  // 🔗 FUNCIÓN COMPARTIR (Opción B)
  const handleShare = () => {
    // Copia la URL actual al portapapeles
    navigator.clipboard.writeText(window.location.href);
    // Cambia el ícono temporalmente
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🗑️ FUNCIÓN DE BORRADO
  const handleDeleteProject = async () => {
    if (!confirm("⚠️ ¿Estás seguro de que quieres ELIMINAR este proyecto permanentemente?\n\nEsta acción borrará el audio, los comentarios y no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);

    try {
      if (project.audio_url) {
        const fileUrl = project.audio_url;
        const filePath = fileUrl.split('/projects/')[1]; 

        if (filePath) {
           await supabase.storage.from('projects').remove([filePath]);
        }
      }

      const { error: dbError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      alert("✅ Proyecto eliminado correctamente.");
      router.push('/projects'); 

    } catch (error: any) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el proyecto.");
      setIsDeleting(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const exactTime = playerRef.current?.getCurrentTime() || "00:00";
    
    const userAvatar = 
      currentUser?.user_metadata?.avatar_url || 
      currentUser?.user_metadata?.picture || 
      `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`;

    const { error } = await supabase.from('comments').insert({
      project_id: id,
      content: newComment,
      user_email: currentUser?.email || "Usuario",
      avatar_url: userAvatar, 
      timestamp: exactTime
    });

    if (!error) {
      setNewComment("");
      fetchComments(); 
    } else {
      alert("Error al enviar comentario.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 gap-4">
      <Loader2 className="animate-spin text-amber-500" size={40} />
      <p className="text-xs uppercase tracking-widest font-bold">Cargando Estudio...</p>
    </div>
  );

  if (!project) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-red-500">Proyecto no encontrado.</div>;

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} flex flex-col`}>
      
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">{project.title}</h1>
            <p className="text-xs text-zinc-500 mt-1">{project.artist}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* BOTÓN COMPARTIR (NUEVO) */}
           <button 
             onClick={handleShare}
             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${copied ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
           >
             {copied ? <Check size={14} /> : <Share2 size={14} />}
             {copied ? "Copiado" : "Compartir"}
           </button>

           {/* BOTÓN ELIMINAR */}
           <button 
             onClick={handleDeleteProject}
             disabled={isDeleting}
             className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
             title="Eliminar Proyecto"
           >
             {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
           </button>

           <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors">
              <Download size={14} /> Descargar
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* MAIN */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative scrollbar-hide">
           
           <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider mb-4">
                 <CheckCircle2 size={12} /> {project.status}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
           </div>

           {/* PLAYER */}
           <div className="mb-12">
              <AudioPlayer 
                url={project.audio_url} 
                comments={comments} 
                ref={playerRef} 
              />
           </div>

           {/* COMENTARIOS */}
           <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                Comentarios <span className="text-zinc-600 text-sm font-normal">({comments.length})</span>
              </h3>

              <div className="flex gap-4 items-start mb-10">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden">
                    <Image 
                      src={currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} 
                      alt="Me" 
                      fill 
                      className="object-cover" 
                    />
                 </div>
                 <div className="flex-1 relative">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Deja un comentario en el momento exacto..." 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none h-24"
                    />
                    <button 
                      onClick={handleSendComment}
                      className="absolute bottom-3 right-3 p-2 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-400 rounded-lg transition-all"
                    >
                      <Send size={16} />
                    </button>
                 </div>
              </div>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden mt-1">
                        <Image 
                           src={comment.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user_email}`} 
                           alt="User" 
                           fill 
                           className="object-cover" 
                        />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-white">{comment.user_email?.split('@')[0]}</span>
                           <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                             {comment.timestamp}
                           </span>
                           <span className="text-[10px] text-zinc-600">• {new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
                           {comment.content}
                        </p>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}