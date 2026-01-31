"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Outfit } from "next/font/google";
import { 
  ArrowLeft, Download, CheckCircle2, Send, Loader2, Trash2, Share2, Check, 
  XCircle, AlertCircle, ThumbsUp, ThumbsDown, ShieldCheck, History, UploadCloud, PlayCircle,
  LayoutGrid
} from "lucide-react"; 
// Asegúrate que la ruta sea la correcta a tu componente
import { AudioPlayer, AudioPlayerRef } from "@/components/projects/AudioPlayer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export default function ProjectDetailPage() {
  const { id } = useParams(); 
  const router = useRouter(); 
  const supabase = createClient();
  const playerRef = useRef<AudioPlayerRef>(null);
  
  // ESTADOS DE DATOS
  const [project, setProject] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // ESTADOS DE UI
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. CARGA INICIAL
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      if (!id) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // O redirigir a login
      setCurrentUser(session.user);
      await fetchProjectData(id as string);
    };
    checkSessionAndFetch();
  }, [id]);

  const fetchProjectData = async (projectId: string) => {
    // A. Proyecto Base
    const { data: projectData, error } = await supabase
      .from('projects').select('*').eq('id', projectId).single();

    if (!error) {
       setProject(projectData);
       // B. Cargar Versiones
       const { data: versionsData } = await supabase
         .from('project_versions')
         .select('*')
         .eq('project_id', projectId)
         .order('created_at', { ascending: false });
       
       if (versionsData && versionsData.length > 0) {
         setVersions(versionsData);
         setCurrentVersion(versionsData[0]);
       } else {
         // Fallback si es la v1.0 original
         const fallback = { id: 'original', version_name: projectData.version || 'v1.0', audio_url: projectData.audio_url, created_at: projectData.created_at };
         setVersions([fallback]);
         setCurrentVersion(fallback);
       }
       fetchComments(projectId);
    }
    setLoading(false);
  };

  const fetchComments = async (projectId: string) => {
    const { data } = await supabase
      .from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  // ROLES
  const isAdmin = currentUser?.user_metadata?.role === 'admin';
  const isUploader = currentUser && project && currentUser.id === project.user_id;

  // ACCIONES
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

      // Guardar en tabla de versiones (Asegúrate de haber corrido el SQL anterior)
      await supabase.from('project_versions').insert({
        project_id: id, version_name: nextVersionName, audio_url: publicUrl
      });

      // Actualizar master
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
    const adminName = currentUser.user_metadata.full_name || "Admin";
    const adminAvatar = currentUser.user_metadata.avatar_url;

    await supabase.from('projects').update({
        status: newStatus, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString(),
        reviewer_name: adminName, reviewer_avatar: adminAvatar
      }).eq('id', id);

    await fetchProjectData(id as string);
    setIsUpdatingStatus(false);
  };

  const handleDeleteProject = async () => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este proyecto y todas sus versiones?")) return; 
    setIsDeleting(true);
    await supabase.from('projects').delete().eq('id', id); 
    router.push('/studio'); // Volver al Hub
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const exactTime = playerRef.current?.getCurrentTime() || "00:00";
    const userAvatar = currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`;
    
    await supabase.from('comments').insert({
      project_id: id, content: newComment, user_email: currentUser?.email, avatar_url: userAvatar, timestamp: exactTime
    });
    setNewComment(""); fetchComments(id as string);
  };

  const handleShare = () => { 
    navigator.clipboard.writeText(window.location.href); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  // 🎨 ESTILOS GEMINIZADOS
  const getStatusColor = (status: string) => {
    if (status === 'Aprobado') return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
    if (status === 'Rechazado') return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 animate-pulse";
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!project) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Proyecto no encontrado.</div>;

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} flex flex-col`}>
      {/* HEADER DE SALA DE CONTROL */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/studio" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} /> <span className="hidden md:inline text-sm font-bold">Studio Hub</span>
          </Link>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none tracking-tight">{project.title}</h1>
            <p className="text-xs text-emerald-500 mt-1 font-medium tracking-wider uppercase">{project.artist}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={handleShare} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${copied ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}>{copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Copiado" : "Compartir"}</button>
           {(isAdmin || isUploader) && (<button onClick={handleDeleteProject} disabled={isDeleting} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">{isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}</button>)}
           <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"><Download size={14} /> Descargar</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative scrollbar-hide flex flex-col">
           {/* INFO SUPERIOR */}
           <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider mb-4 ${getStatusColor(project.status)}`}>
                    {project.status === 'Aprobado' ? <CheckCircle2 size={16} /> : project.status === 'Rechazado' ? <XCircle size={16} /> : <AlertCircle size={16} />} 
                    {project.status}
                 </div>
                 <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{project.title}</h2>
                 <div className="flex items-center gap-3">
                    <p className="text-zinc-500 text-sm">Versión en reproducción:</p>
                    <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono rounded">{currentVersion?.version_name || project.version}</span>
                 </div>
              </div>

              {/* PANEL DE DECISIÓN ADMIN */}
              <div className="w-full md:w-auto">
                {project.status === 'En Revisión' ? (
                  isAdmin ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 backdrop-blur-md">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider text-center mb-2">Acción Requerida</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleReviewAction('Aprobado')} disabled={isUpdatingStatus} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black rounded-xl font-bold text-sm transition-all">{isUpdatingStatus ? <Loader2 className="animate-spin" size={18} /> : <ThumbsUp size={18} />} Aprobar</button>
                        <button onClick={() => handleReviewAction('Rechazado')} disabled={isUpdatingStatus} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-black rounded-xl font-bold text-sm transition-all">{isUpdatingStatus ? <Loader2 className="animate-spin" size={18} /> : <ThumbsDown size={18} />} Rechazar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-900/10 border border-dashed border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md text-center">
                       <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" />
                       <p className="text-sm font-bold text-emerald-100">En Cola de Revisión</p>
                    </div>
                  )
                ) : (
                  <div className={`flex items-center gap-4 bg-black/50 p-4 rounded-2xl border backdrop-blur-xl ${project.status === 'Aprobado' ? 'border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.1)]' : 'border-zinc-800'}`}>
                     <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700 relative">
                        <Image src={project.reviewer_avatar || "/default-avatar.png"} alt="Admin" fill className="object-cover" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-0.5"><p className="text-[10px] text-emerald-500 uppercase font-extrabold tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-1.5 rounded">STAFF</p></div>
                        <p className="text-white font-bold text-sm">{project.status} por <span className="text-emerald-200">{project.reviewer_name || "Admin"}</span></p>
                     </div>
                  </div>
                )}
              </div>
           </div>

           {/* 🎹 ZONA DE TRABAJO (PLAYER + HISTORIAL) */}
           <div className="mb-12 flex flex-col lg:flex-row gap-6">
              
              {/* PLAYER (TU COMPONENTE) */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-800 bg-[#0F1112] shadow-2xl relative">
                 <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-zinc-400 border border-white/10">WAV 48kHz</span>
                 </div>
                 {/* Aquí se inyectan los comentarios para que aparezcan en la onda */}
                 {currentVersion && <AudioPlayer url={currentVersion.audio_url} comments={comments} ref={playerRef} />}
              </div>

              {/* SIDEBAR DE VERSIONES (Time Travel) */}
              <div className="w-full lg:w-72 bg-[#0F1112] border border-zinc-800 rounded-3xl p-5 flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                       <History size={14} /> Historial
                    </h3>
                    {(isAdmin || isUploader) && (
                      <label className={`cursor-pointer p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-500 rounded-lg transition-all ${isUploadingVersion ? 'opacity-50 pointer-events-none' : ''}`}>
                         {isUploadingVersion ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                         <input type="file" accept="audio/*" className="hidden" onChange={handleUploadNewVersion} disabled={isUploadingVersion} />
                      </label>
                    )}
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {versions.map((ver) => (
                       <button key={ver.id} onClick={() => handleSwitchVersion(ver)} className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${currentVersion?.id === ver.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}>
                          <div className="flex flex-col">
                             <span className="font-bold text-sm flex items-center gap-2">{ver.version_name} {currentVersion?.id === ver.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}</span>
                             <span className="text-[10px] opacity-50">{new Date(ver.created_at).toLocaleDateString()}</span>
                          </div>
                          <PlayCircle size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentVersion?.id === ver.id ? 'opacity-100' : ''}`} />
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* 💬 COMENTARIOS (Feedback Loop) */}
           <div className="max-w-4xl mx-auto w-full">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">Feedback de la Sesión ({comments.length})</h3>
              <div className="flex gap-4 items-start mb-10 bg-[#0F1112] p-4 rounded-2xl border border-zinc-800">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 relative overflow-hidden"><Image src={currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.email}`} alt="Me" fill className="object-cover" /></div>
                 <div className="flex-1 relative">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Deja un comentario vinculado al segundo exacto..." className="w-full bg-transparent border-none p-2 text-sm text-white focus:ring-0 resize-none h-20 placeholder:text-zinc-600" />
                    <div className="flex justify-between items-center mt-2 border-t border-zinc-800 pt-2">
                        <span className="text-xs text-emerald-500 font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{playerRef.current?.getCurrentTime() || "00:00"}</span>
                        <button onClick={handleSendComment} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/20"><Send size={16} /></button>
                    </div>
                 </div>
              </div>
              <div className="space-y-4 pb-20">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-4 group p-4 hover:bg-zinc-900/30 rounded-2xl transition-colors border border-transparent hover:border-zinc-800/50">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden relative mt-1"><Image src={c.avatar_url || "/default-avatar.png"} alt="User" fill className="object-cover" /></div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-white">{c.user_email?.split('@')[0]}</span><span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{c.timestamp}</span></div>
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