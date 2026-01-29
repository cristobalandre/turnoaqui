"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { UploadCloud, Music, X, CheckCircle2, Loader2, User, ChevronDown, Plus, Image as ImageIcon, ArrowLeft } from "lucide-react";

const ffmpeg = createFFmpeg({ log: true });

export default function NewProjectModal({ onClose }: { onClose?: () => void }) {
  // ESTADOS DE PROYECTO (AUDIO)
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Esperando archivo...");
  
  // ESTADOS DE SELECCIÓN DE ARTISTA
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistName, setSelectedArtistName] = useState("");
  const [loadingArtists, setLoadingArtists] = useState(true);

  // 🆕 ESTADOS PARA CREACIÓN RÁPIDA DE ARTISTA
  const [isCreatingArtist, setIsCreatingArtist] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistFile, setNewArtistFile] = useState<File | null>(null);
  const [creatingArtistLoading, setCreatingArtistLoading] = useState(false);

  const supabase = createClient();

  // 1. CARGAR ARTISTAS AL ABRIR
  const fetchArtists = async () => {
    setLoadingArtists(true);
    const { data } = await supabase.from('artists').select('name, image_url').order('name');
    if (data) {
      setArtists(data);
      // Si no hay ninguno seleccionado, elige el primero
      if (data.length > 0 && !selectedArtistName) setSelectedArtistName(data[0].name);
    }
    setLoadingArtists(false);
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  // --- LÓGICA DE AUDIO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("Listo para subir");
    }
  };

  const sanitizeFileName = (name: string) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  };

  const processAndUpload = async () => {
    if (!file) return;
    if (!selectedArtistName.trim()) return alert("Debes seleccionar un artista");

    setUploading(true);
    setProgress(0);

    try {
      const cleanName = sanitizeFileName(file.name);
      let fileToUpload = new File([file], cleanName, { type: file.type });
      let fileName = cleanName;

      try {
        if (!ffmpeg.isLoaded()) {
            setStatus("Cargando motor...");
            await ffmpeg.load();
        }
        setStatus("Optimizando Audio...");
        ffmpeg.FS("writeFile", file.name, await fetchFile(file));
        await ffmpeg.run("-i", file.name, "-b:a", "128k", "output.mp3");
        const data = ffmpeg.FS("readFile", "output.mp3");
        const blob = new Blob([data.buffer as ArrayBuffer], { type: "audio/mp3" });
        fileToUpload = new File([blob], "opt_" + fileName, { type: "audio/mp3" });
        fileName = fileToUpload.name;
        setStatus("¡Optimizado!");
      } catch (err) {
        console.warn("Saltando optimización...", err);
      }

      setProgress(50);
      setStatus("Subiendo a la nube...");
      const filePath = `uploads/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage.from('projects').upload(filePath, fileToUpload);
      if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

      setStatus("Guardando datos...");
      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath);
      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase.from('projects').insert({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: selectedArtistName,
        status: "En Revisión",
        version: "v1.0",
        audio_url: publicUrl,
        user_id: user?.id 
      });

      if (dbError) throw new Error(`Database: ${dbError.message}`);

      setProgress(100);
      setStatus("¡Completado!");
      setTimeout(() => { if (onClose) onClose(); window.location.reload(); }, 500);

    } catch (error: any) {
      console.error("❌ ERROR:", error);
      alert(`Error: ${error.message}`);
      setUploading(false);
      setStatus("Reintentar");
    }
  };

  // --- LÓGICA DE CREAR ARTISTA RÁPIDO ---
  const handleCreateArtist = async () => {
    if (!newArtistName.trim()) return alert("El nombre es obligatorio");
    setCreatingArtistLoading(true);

    try {
        let publicAvatarUrl = null;
        if (newArtistFile) {
            const fileExt = newArtistFile.name.split('.').pop();
            const fileName = `quick_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('artists').upload(filePath, newArtistFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('artists').getPublicUrl(filePath);
            publicAvatarUrl = data.publicUrl;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const { error: dbError } = await supabase.from('artists').insert({
            name: newArtistName,
            image_url: publicAvatarUrl,
            user_id: user?.id
        });

        if (dbError) throw dbError;

        // Éxito: Recargar lista y seleccionar el nuevo
        await fetchArtists();
        setSelectedArtistName(newArtistName);
        setIsCreatingArtist(false); // Volver al modo normal
        setNewArtistName("");
        setNewArtistFile(null);

    } catch (error: any) {
        alert("Error creando artista: " + error.message);
    } finally {
        setCreatingArtistLoading(false);
    }
  };

  return (
    <div className="bg-[#0F1112] w-full max-w-md rounded-3xl border border-zinc-800 p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="text-amber-500" size={24} /> {isCreatingArtist ? "Nuevo Artista" : "Subir Maqueta"}
        </h2>
        {onClose && (
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
             <X size={20} />
           </button>
        )}
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        
        {/* MODO 1: SUBIR AUDIO (Normal) */}
        {!isCreatingArtist && (
            <>
                {/* 1. DROPZONE */}
                <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors group">
                {file ? (
                    <div className="text-center">
                        <p className="text-sm text-white font-medium truncate max-w-[200px]">{file.name}</p>
                        <button onClick={() => setFile(null)} className="mt-3 text-[10px] text-red-400 hover:text-red-300 underline">Cambiar archivo</button>
                    </div>
                ) : (
                    <label className="cursor-pointer text-center w-full">
                        <UploadCloud className="text-zinc-600 group-hover:text-amber-500 transition-colors mb-4 mx-auto" size={40} />
                        <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">Toca para buscar audio</span>
                        <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                    </label>
                )}
                </div>

                {/* 2. SELECTOR DE ARTISTA */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Asignar Artista</label>
                        {/* BOTÓN PARA CAMBIAR A MODO CREACIÓN */}
                        <button 
                            onClick={() => setIsCreatingArtist(true)}
                            className="text-[10px] flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold transition-colors"
                        >
                            <Plus size={12} /> Nuevo Artista
                        </button>
                    </div>
                    
                    {loadingArtists ? (
                        <div className="h-12 bg-zinc-900 rounded-xl animate-pulse"></div>
                    ) : (
                        <div className="relative">
                            <select 
                                value={selectedArtistName}
                                onChange={(e) => setSelectedArtistName(e.target.value)}
                                className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                            >
                                <option value="" disabled>Selecciona...</option>
                                {artists.map((artist, i) => (
                                    <option key={i} value={artist.name}>{artist.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                        </div>
                    )}
                </div>

                {/* 3. BARRA DE PROGRESO */}
                {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <span className="flex items-center gap-2">
                        {progress < 100 ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                        {status}
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                )}

                <button
                onClick={processAndUpload}
                disabled={!file || uploading || !selectedArtistName}
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg
                    ${!file || uploading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02]'}`}
                >
                {uploading ? 'Procesando...' : 'Subir Maqueta'}
                </button>
            </>
        )}

        {/* MODO 2: CREACIÓN RÁPIDA DE ARTISTA */}
        {isCreatingArtist && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
                    {/* FOTO */}
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer group relative w-16 h-16 rounded-full bg-zinc-800 border border-dashed border-zinc-600 hover:border-amber-500 flex flex-shrink-0 items-center justify-center overflow-hidden transition-all">
                            {newArtistFile ? (
                                <img src={URL.createObjectURL(newArtistFile)} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-zinc-500 group-hover:text-amber-500" size={20} />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setNewArtistFile(e.target.files[0])} />
                        </label>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre Artístico</label>
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Ej. Bad Bunny" 
                                value={newArtistName}
                                onChange={(e) => setNewArtistName(e.target.value)}
                                className="w-full bg-transparent border-b border-zinc-700 text-white py-2 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCreatingArtist(false)}
                        className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-700 transition-colors text-xs uppercase"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateArtist}
                        disabled={creatingArtistLoading || !newArtistName.trim()}
                        className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors text-xs uppercase flex items-center justify-center gap-2"
                    >
                        {creatingArtistLoading ? <Loader2 size={14} className="animate-spin" /> : "Guardar Artista"}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}