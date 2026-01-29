"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { UploadCloud, Music, X, CheckCircle2, Loader2 } from "lucide-react";

const ffmpeg = createFFmpeg({ log: true });

export default function NewProjectModal({ onClose }: { onClose?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Esperando archivo...");
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("Listo para subir");
    }
  };

  // 🧼 LA LAVADORA DE NOMBRES (Vital para evitar errores)
  const sanitizeFileName = (name: string) => {
    // Quita acentos y caracteres raros
    return name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
      .replace(/[^a-zA-Z0-9.]/g, "_") // Cambia espacios y símbolos por _
      .toLowerCase();
  };

  const processAndUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      // 1. LIMPIEZA DEL NOMBRE
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
        // FFmpeg necesita el nombre original para leerlo de memoria
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
      // Agregamos timestamp para que sea único
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
        title: file.name.replace(/\.[^/.]+$/, ""), // Título original bonito
        artist: user?.user_metadata?.full_name || "Artista",
        status: "En Revisión",
        version: "v1.0",
        audio_url: publicUrl,
        user_id: user?.id // Puede ser null si el usuario es anon, pero la tabla lo aceptará
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

  // ... (El resto del return es igual) ...
  return (
    <div className="bg-[#0F1112] w-full max-w-md rounded-3xl border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
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

      <div className="space-y-6">
        <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors group">
           {file ? (
             <div className="text-center">
                <p className="text-sm text-white font-medium truncate max-w-[200px]">{file.name}</p>
                <button onClick={() => setFile(null)} className="mt-3 text-[10px] text-red-400 hover:text-red-300 underline">Cambiar archivo</button>
             </div>
           ) : (
             <label className="cursor-pointer text-center w-full">
                <UploadCloud className="text-zinc-600 group-hover:text-amber-500 transition-colors mb-4 mx-auto" size={40} />
                <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">Haz click para buscar</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
             </label>
           )}
        </div>

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
          disabled={!file || uploading}
          className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg
            ${!file || uploading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02]'}`}
        >
          {uploading ? 'Procesando...' : 'Subir Maqueta'}
        </button>
      </div>
    </div>
  );
}