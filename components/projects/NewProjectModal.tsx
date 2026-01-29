"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { UploadCloud, Music, X, CheckCircle2, Loader2, User, ChevronDown } from "lucide-react";
import Link from "next/link";

const ffmpeg = createFFmpeg({ log: true });

export default function NewProjectModal({ onClose }: { onClose?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Esperando archivo...");
  
  // 🆕 ESTADOS PARA ARTISTAS
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistName, setSelectedArtistName] = useState("");
  const [loadingArtists, setLoadingArtists] = useState(true);

  const supabase = createClient();

  // 1. CARGAR ARTISTAS AL ABRIR
  useEffect(() => {
    const fetchArtists = async () => {
      const { data } = await supabase.from('artists').select('name, image_url').order('name');
      if (data) {
        setArtists(data);
        if (data.length > 0) setSelectedArtistName(data[0].name); // Seleccionar el primero por defecto
      }
      setLoadingArtists(false);
    };
    fetchArtists();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("Listo para subir");
    }
  };

  const sanitizeFileName = (name: string) => {
    return name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.]/g, "_")
      .toLowerCase();
  };

  const processAndUpload = async () => {
    if (!file) return;
    // VALIDACIÓN: Debe haber un artista seleccionado o escrito
    if (!selectedArtistName.trim()) return alert("Debes seleccionar un artista");

    setUploading(true);
    setProgress(0);

    try {
      // 1. LIMPIEZA INICIAL
      const cleanName = sanitizeFileName(file.name);
      let fileToUpload = new File([file], cleanName, { type: file.type });
      let fileName = cleanName;

      // 2. OPTIMIZACIÓN (Intento)
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

      // 3. SUBIDA AL STORAGE
      setStatus("Subiendo a la nube...");
      const filePath = `uploads/${Date.now()}_${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, fileToUpload);

      if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

      // 4. GUARDAR EN BASE DE DATOS
      setStatus("Guardando datos...");
      
      const { data: { publicUrl } } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath);

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase.from('projects').insert({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: selectedArtistName, // 👈 AQUÍ USAMOS EL NOMBRE DEL SELECTOR
        status: "En Revisión",
        version: "v1.0",
        audio_url: publicUrl,
        user_id: user?.id 
      });

      if (dbError) throw new Error(`Database: ${dbError.message}`);

      setProgress(100);
      setStatus("¡Completado!");
      
      setTimeout(() => {
        if (onClose) onClose();
        window.location.reload(); 
      }, 500);

    } catch (error: any) {
      console.error("❌ ERROR:", error);
      alert(`Error: ${error.message}`);
      setUploading(false);
      setStatus("Reintentar");
    }
  };

  return (
    <div className="bg-[#0F1112] w-full max-w-md rounded-3xl border border-zinc-800 p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="text-amber-500" size={24} /> Subir Maqueta
        </h2>
        {onClose && (
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
             <X size={20} />
           </button>
        )}
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        
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

        {/* 2. SELECTOR DE ARTISTA (NUEVO) */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Asignar Artista</label>
            
            {loadingArtists ? (
                <div className="h-12 bg-zinc-900 rounded-xl animate-pulse"></div>
            ) : artists.length > 0 ? (
                <div className="relative">
                    <select 
                        value={selectedArtistName}
                        onChange={(e) => setSelectedArtistName(e.target.value)}
                        className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                    >
                        {artists.map((artist, i) => (
                            <option key={i} value={artist.name}>{artist.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                </div>
            ) : (
                <div className="text-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <p className="text-sm text-zinc-400 mb-2">No tienes artistas en el Roster.</p>
                    <Link href="/artists">
                        <button className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                            + Crear Artista Primero
                        </button>
                    </Link>
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
          disabled={!file || uploading || (!selectedArtistName && artists.length > 0)}
          className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg
            ${!file || uploading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02]'}`}
        >
          {uploading ? 'Procesando...' : 'Subir Maqueta'}
        </button>
      </div>
    </div>
  );
}