"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { 
  ArrowLeft, Download, CheckCircle2, Send, Loader2, Trash2, Share2, Check, 
  XCircle, AlertCircle, ThumbsUp, ThumbsDown, History, UploadCloud, PlayCircle,
  MoreVertical, Clock, Music2
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
  
  // --- ESTADOS DE DATOS (LÓGICA INTACTA) ---
  const [project, setProject] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Estados de UI
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      if (!id) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUser(session.user);
      await fetchProjectData(id as string);
    };
    checkSessionAndFetch();
  }, [id]);

  const fetchProjectData = async (projectId: string) => {
    const { data: projectData, error } = await supabase
      .from('projects').select('*').eq('id', projectId).single();

    if (!error) {
       setProject(projectData);
       
       const { data: versionsData } = await supabase
         .from('project_versions')
         .select('*')
         .eq('project_id', projectId)
         .order('created_at', { ascending: false });
       
       if (versionsData && versionsData.length > 0) {
         setVersions(versionsData);
         setCurrentVersion(versionsData[0]);
       } else {
         const fallback = { 
            id: 'original', 
            version_name: projectData.version || 'v1.0', 
            audio_url: projectData.audio_url, 
            created_at: projectData.created_at 
         };
         setVersions([fallback]);
         setCurrentVersion(fallback);
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

  // --- HANDLERS (LÓGICA INTACTA) ---
  const isAdmin = currentUser?.user_metadata?.role === 'admin';
  const isUploader = currentUser && project && currentUser.id === project.user_id;

  const handleSwitchVersion = (version: any) => setCurrentVersion(version);

  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingVersion(true);
    try {
      const nextVersionNum = versions.length + 1;
      const nextVersionName = `v${nextVersionNum}.0`;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${nextVersionName}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('projects').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath);

      await supabase.from('project_versions').insert({
        project_id: id, version_name: nextVersionName, audio_url: publicUrl
      });

      await supabase.from('projects').update({
        version: nextVersionName, audio_url: publicUrl, status: 'En Revisión' 
      }).eq('id', id);

      alert(`✅ Versión ${nextVersionName} subida.`);
      await fetchProjectData(id as string);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleReviewAction = async (newStatus: 'Aprobado' | 'Rechazado') => {
    if (!isAdmin) return;
    setIsUpdatingStatus(true);
    await supabase.from('projects').update({
        status: newStatus, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString(),
        reviewer_name: currentUser.user_metadata.full_name || "Admin", 
        reviewer_avatar: currentUser.user_metadata.avatar_url
      }).eq('id', id);

    await fetchProjectData(id as string);
    setIsUpdatingStatus(false);
  };

  const handleDeleteProject = async () => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este proyecto?")) return; 
    setIsDeleting(true);
    await supabase.from('projects').delete().eq('id', id); 
    router.push('/projects'); 
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const exactTime = playerRef.current?.getCurrentTime() || "00:00";
    await supabase.from('comments').insert({
      project_id: id, content: newComment, user_email: currentUser?.email, 
      avatar_url: currentUser?.user_metadata?.avatar_url, timestamp: exactTime
    });
    setNewComment(""); fetchComments(id as string);
  };

  const handleShare = () => { 
    navigator.clipboard.writeText(window.location.href); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  const getStatusColor = (status: string) => {
    if (status === 'Aprobado') return "text-emerald-400 bg-emerald-900/20 border-emerald-500/20";
    if (status === 'Rechazado') return "text-red-400 bg-red-900/20 border-red-500/20";
    return "text-cyan-400 bg-cyan-900/20 border-cyan-500/20 animate-pulse";
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" /></div>;
  if (!project) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500">Proyecto no encontrado.</div>;

  return (
    <div className={`min-h-screen bg-[#050505] text-zinc-300 ${outfit.className} flex flex-col overflow-hidden selection:bg-fuchsia-500/30`}>
      
      {/* 🎨 FONDO ARTÍSTICO (Igual que el Dashboard) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[120px]" />
      </div>

      {/* HEADER TOOLBAR */}
      <header className="relative z-10 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="p-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="hidden sm:inline">Galería</span>
          </Link>
          <div className="h-8 w-[1px] bg-white/5 hidden sm:block"></div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none tracking-tight mb-1">{project.title}</h1>
            <p className="text-xs text-fuchsia-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Music2 size={10} /> {project.artist}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={handleShare} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${copied ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}>{copied ? <Check size={14} /> : <Share2 size={14} />}</button>
           {(isAdmin || isUploader) && (<button onClick={handleDeleteProject} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>)}
           <button className="hidden sm:flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"><Download size={14} /> Master</button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-800">
           
           {/* BARRA DE ESTADO & ADMIN */}
           <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${getStatusColor(project.status)}`}>
                    {project.status === 'Aprobado' ? <CheckCircle2 size={14} /> : project.status === 'Rechazado' ? <XCircle size={14} /> : <AlertCircle size={14} />} 
                    {project.status}
                 </div>
                 <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <Clock size={12} /> Versión actual: <span className="text-white font-bold">{currentVersion?.version_name || project.version}</span>
                 </div>
              </div>

              {/* Panel Admin (Solo visible para Admin) */}
              <div className="w-full md:w-auto">
                {project.status === 'En Revisión' ? (
                  isAdmin ? (
                    <div className="bg-[#0F0F11] border border-fuchsia-500/20 rounded-xl p-3 flex gap-3 shadow-[0_0_30px_-10px_rgba(217,70,239,0.15)]">
                        <button onClick={() => handleReviewAction('Aprobado')} disabled={isUpdatingStatus} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black rounded-lg text-xs font-bold transition-all uppercase tracking-wide">{isUpdatingStatus ? <Loader2 className="animate-spin" size={14} /> : <ThumbsUp size={14} />} Aprobar</button>
                        <button onClick={() => handleReviewAction('Rechazado')} disabled={isUpdatingStatus} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-black rounded-lg text-xs font-bold transition-all uppercase tracking-wide">{isUpdatingStatus ? <Loader2 className="animate-spin" size={14} /> : <ThumbsDown size={14} />} Rechazar</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-fuchsia-500 bg-fuchsia-500/10 px-4 py-2 rounded-xl border border-fuchsia-500/20 animate-pulse">
                       <Loader2 size={14} className="animate-spin" /> <span className="text-xs font-bold uppercase tracking-widest">Esperando Revisión</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-3 bg-[#0F0F11] px-4 py-2 rounded-xl border border-white/5">
                     <div className="w-6 h-6 rounded-full overflow-hidden relative border border-white/10"><Image src={project.reviewer_avatar || "/default-avatar.png"} alt="Admin" fill className="object-cover" /></div>
                     <p className="text-zinc-400 text-xs"><span className="text-emerald-500 font-bold uppercase text-[10px] mr-2">STAFF</span> Revisado por <span className="text-white font-medium">{project.reviewer_name || "Admin"}</span></p>
                  </div>
                )}
              </div>
           </div>

           {/* --- AREA PRINCIPAL (Player + Versiones) --- */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              
              {/* 1. REPRODUCTOR (Ocupa 2 columnas) */}
              <div className="lg:col-span-2 relative group">
                 {/* Borde Brillante Decorativo */}
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-emerald-600 rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                 
                 <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                     {/* Header del Player */}
                     <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">MASTER AUDIO</span>
                     </div>
                     
                     {/* El Componente AudioPlayer */}
                     <div className="p-1">
                        {currentVersion && <AudioPlayer url={currentVersion.audio_url} comments={comments} ref={playerRef} />}
                     </div>
                 </div>
              </div>

              {/* 2. BARRA LATERAL (Historial) */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col h-[500px]">
                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <History size={14} /> Historial
                    </h3>
                    {(isAdmin || isUploader) && (
                      <label className="cursor-pointer text-fuchsia-500 hover:text-white transition-colors p-2 hover:bg-fuchsia-500 rounded-lg">
                         {isUploadingVersion ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                         <input type="file" accept="audio/*" className="hidden" onChange={handleUploadNewVersion} disabled={isUploadingVersion} />
                      </label>
                    )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 space-y-2">
                    {versions.map((ver) => (
                       <button 
                          key={ver.id} 
                          onClick={() => handleSwitchVersion(ver)} 
                          className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 group ${currentVersion?.id === ver.id ? 'bg-white/5 border-fuchsia-500/50 shadow-[0_0_15px_-5px_rgba(217,70,239,0.3)]' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
                       >
                          <div className="flex flex-col">
                             <span className={`font-bold text-sm tracking-wide ${currentVersion?.id === ver.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{ver.version_name}</span>
                             <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">{new Date(ver.created_at).toLocaleDateString()}</span>
                          </div>
                          {currentVersion?.id === ver.id ? (
                              <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_#d946ef] animate-pulse" />
                          ) : (
                              <PlayCircle size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                          )}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* --- SECCIÓN COMENTARIOS (Estilo Chat) --- */}
           <div className="max-w-3xl mx-auto w-full pb-20">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Comentarios de la Sesión</h3>
              
              {/* Input */}
              <div className="flex gap-4 items-start mb-10 bg-[#0F0F11] p-1 rounded-2xl border border-white/10 shadow-lg focus-within:border-fuchsia-500/50 transition-colors">
                 <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden relative m-3"><Image src={currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} alt="Me" fill className="object-cover" /></div>
                 <div className="flex-1 relative">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario..." className="w-full bg-transparent border-none p-4 text-sm text-white focus:ring-0 resize-none h-20 placeholder:text-zinc-600" />
                    <div className="flex justify-between items-center px-4 pb-3">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded border border-fuchsia-500/20">{playerRef.current?.getCurrentTime() || "00:00"}</span>
                        </div>
                        <button onClick={handleSendComment} className="p-2 bg-white hover:bg-zinc-200 text-black rounded-lg transition-all shadow-lg hover:scale-105"><Send size={16} /></button>
                    </div>
                 </div>
              </div>

              {/* Lista */}
              <div className="space-y-6 relative">
                <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-zinc-800 z-0"></div> {/* Línea de tiempo conectora */}
                
                {comments.map((c) => (
                  <div key={c.id} className="relative z-10 pl-12 group">
                     {/* Avatar flotante en la línea */}
                     <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#050505] border-2 border-zinc-800 flex items-center justify-center group-hover:border-fuchsia-500/50 transition-colors overflow-hidden">
                        <Image src={c.avatar_url || "/default-avatar.png"} alt="User" width={40} height={40} className="object-cover" />
                     </div>
                     
                     <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl rounded-tl-none hover:bg-[#0F0F11] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">{c.user_email?.split('@')[0]}</span>
                            <span className="text-[10px] font-mono text-zinc-500 group-hover:text-fuchsia-500 transition-colors">{c.timestamp}</span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">{c.content}</p>
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