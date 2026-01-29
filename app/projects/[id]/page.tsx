"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Outfit } from "next/font/google";
import { ArrowLeft, Download, CheckCircle2, Send } from "lucide-react";
import { AudioPlayer, AudioPlayerRef } from "@/components/projects/AudioPlayer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectDetailPage() {
  const { id } = useParams(); 
  const supabase = createClient();
  const playerRef = useRef<AudioPlayerRef>(null);
  
  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single();
      setProject(projectData);

      fetchComments();
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const exactTime = playerRef.current?.getCurrentTime() || "00:00";
    
    // ✅ CAPTURAMOS LA FOTO REAL (O usamos una por defecto segura)
    const userAvatar = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`;
    const userEmail = currentUser?.email || "Usuario";

    const { error } = await supabase.from('comments').insert({
      project_id: id,
      content: newComment,
      user_email: userEmail,
      avatar_url: userAvatar, // ✅ Guardamos la foto
      timestamp: exactTime
    });

    if (!error) {
      setNewComment("");
      fetchComments(); 
    } else {
      console.error("Error al comentar:", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
  if (!project) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-red-500">No encontrado</div>;

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} flex flex-col`}>
      
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
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors">
              <Download size={14} /> Descargar
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative scrollbar-hide">
           
           <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider mb-4">
                 <CheckCircle2 size={12} /> {project.status}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
           </div>

           {/* 🎵 PLAYER CON MARCADORES */}
           <div className="mb-12">
              <AudioPlayer 
                url={project.audio_url} 
                comments={comments} // ✅ Pasamos los comentarios para que se vean en la onda
                ref={playerRef} 
              />
           </div>

           {/* 💬 COMENTARIOS */}
           <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                Comentarios <span className="text-zinc-600 text-sm font-normal">({comments.length})</span>
              </h3>

              <div className="flex gap-4 items-start mb-10">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden">
                    <Image 
                      src={currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} 
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
                        {/* FOTO REAL EN LA LISTA */}
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