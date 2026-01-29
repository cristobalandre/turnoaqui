"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { 
  ArrowLeft, Download, CheckCircle2, Send, Loader2, Trash2, Share2, Check, 
  XCircle, AlertCircle, ThumbsUp, ThumbsDown 
} from "lucide-react";
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
  const [reviewerData, setReviewerData] = useState<any>(null); // Datos del Staff que revisó
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Estado para botones de revisión
  const [copied, setCopied] = useState(false);

  // 1. CARGA INICIAL Y SEGURIDAD
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href },
        });
        return;
      }

      setCurrentUser(session.user);
      fetchProjectData(id as string);
    };

    checkSessionAndFetch();
  }, [id]);

  // Función separada para cargar/recargar el proyecto
  const fetchProjectData = async (projectId: string) => {
    // Cargar Proyecto
    const { data: projectData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
       console.error("Error cargando proyecto:", error);
    } else {
       setProject(projectData);
       
       // Si ya fue revisado, cargar datos del revisor
       if (projectData.reviewed_by) {
          // Truco: Usamos una función RPC de Supabase o una consulta directa si tenemos permisos.
          // Por ahora, para simplificar, obtenemos el usuario de manera pública si es posible, 
          // o usamos los metadatos si el usuario actual es el mismo que revisó.
          // NOTA: Para producción, lo ideal es crear un perfil público de usuarios en otra tabla.
          // Por ahora, simularemos la carga del avatar usando el ID.
          setReviewerData({ id: projectData.reviewed_by });
       }
       fetchComments(projectId);
    }
    setLoading(false);
  };

  const fetchComments = async (projectId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  // 🎛️ FUNCIÓN DE REVISIÓN (NUEVA)
  const handleReviewAction = async (newStatus: 'Aprobado' | 'Rechazado') => {
    if (!currentUser) return;
    setIsUpdatingStatus(true);

    const { error } = await supabase
      .from('projects')
      .update({
        status: newStatus,
        reviewed_by: currentUser.id, // Guardamos QUIÉN lo hizo
        reviewed_at: new Date().toISOString(), // Guardamos CUÁNDO
      })
      .eq('id', id);

    if (error) {
      alert("Error al actualizar el estado");
    } else {
      // Recargar datos para mostrar el nuevo estado
      fetchProjectData(id as string);
    }
    setIsUpdatingStatus(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteProject = async () => {
    if (!confirm("⚠️ ¿Estás seguro?")) return;
    setIsDeleting(true);
    try {
      if (project.audio_url) {
        const filePath = project.audio_url.split('/projects/')[1]; 
        if (filePath) await supabase.storage.from('projects').remove([filePath]);
      }
      await supabase.from('projects').delete().eq('id', id);
      router.push('/projects'); 
    } catch (error: any) {
      alert("Error al eliminar.");
      setIsDeleting(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const exactTime = playerRef.current?.getCurrentTime() || "00:00";
    const userAvatar = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`;
    const { error } = await supabase.from('comments').insert({
      project_id: id,
      content: newComment,
      user_email: currentUser?.email || "Usuario",
      avatar_url: userAvatar, 
      timestamp: exactTime
    });
    if (!error) { setNewComment(""); fetchComments(id as string); }
  };

  // Helpers de UI para el estado
  const getStatusColor = (status: string) => {
    if (status === 'Aprobado') return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (status === 'Rechazado') return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };
  
  const getStatusIcon = (status: string) => {
    if (status === 'Aprobado') return <CheckCircle2 size={16} />;
    if (status === 'Rechazado') return <XCircle size={16} />;
    return <AlertCircle size={16} />;
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!project) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">No encontrado.</div>;

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
           <button onClick={handleShare} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${copied ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}>
             {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Copiado" : "Compartir"}
           </button>
           <button onClick={handleDeleteProject} disabled={isDeleting} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
             {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors">
              <Download size={14} /> Descargar
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative scrollbar-hide flex flex-col">
           
           {/* SECCIÓN DE ESTADO Y REVISIÓN */}
           <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider mb-4 ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)} {project.status}
                 </div>
                 <h2 className="text-4xl font-bold text-white mb-2">{project.title}</h2>
                 <p className="text-zinc-400">Versión: {project.version}</p>
              </div>

              {/* 🎛️ PANEL DE CONTROL DE REVISIÓN */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 backdrop-blur-md w-full md:w-auto">
                {project.status === 'En Revisión' ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider text-center mb-2">Acciones de Staff</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleReviewAction('Aprobado')}
                        disabled={isUpdatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {isUpdatingStatus ? <Loader2 className="animate-spin" size={18} /> : <ThumbsUp size={18} />} Aprobar
                      </button>
                      <button 
                        onClick={() => handleReviewAction('Rechazado')}
                        disabled={isUpdatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-black rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      >
                         {isUpdatingStatus ? <Loader2 className="animate-spin" size={18} /> : <ThumbsDown size={18} />} Rechazar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TARJETA DE RESULTADO DE REVISIÓN */
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 relative">
                        {/* Intentamos mostrar avatar del revisor si tenemos su ID */}
                        {project.reviewed_by && (
                           <Image 
                           src={currentUser && currentUser.id === project.reviewed_by ? (currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${project.reviewed_by}`} 
                           alt="Staff" fill className="object-cover" 
                           />
                        )}
                     </div>
                     <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold">Revisado por Staff</p>
                        <p className="text-white font-bold flex items-center gap-2">
                          {getStatusIcon(project.status)}
                          {project.status} el {new Date(project.reviewed_at).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                )}
              </div>
           </div>

           {/* PLAYER */}
           <div className="mb-12">
              <AudioPlayer url={project.audio_url} comments={comments} ref={playerRef} />
           </div>

           {/* COMENTARIOS (Igual que antes) */}
           <div className="max-w-3xl mx-auto w-full">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                Comentarios <span className="text-zinc-600 text-sm font-normal">({comments.length})</span>
              </h3>

              <div className="flex gap-4 items-start mb-10">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden">
                    <Image src={currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} alt="Me" fill className="object-cover" />
                 </div>
                 <div className="flex-1 relative">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Deja un comentario..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all resize-none h-24" />
                    <button onClick={handleSendComment} className="absolute bottom-3 right-3 p-2 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-400 rounded-lg transition-all"><Send size={16} /></button>
                 </div>
              </div>

              <div className="space-y-6 pb-20">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden mt-1">
                        <Image src={comment.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user_email}`} alt="User" fill className="object-cover" />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-white">{comment.user_email?.split('@')[0]}</span>
                           <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{comment.timestamp}</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">{comment.content}</p>
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