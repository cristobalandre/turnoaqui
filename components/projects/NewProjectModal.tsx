"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { UploadCloud, Music, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Inicializamos FFmpeg (Logueo activado para ver detalles en consola)
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

  const processAndUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      let fileToUpload = file;
      let fileName = file.name;

      // --- 1. INTENTO DE OPTIMIZACIÓN (FFmpeg) ---
      try {
        if (!ffmpeg.isLoaded()) {
          setStatus("Cargando motor de audio...");
          await ffmpeg.load();
        }

        setStatus("Optimizando Audio...");
        ffmpeg.FS("writeFile", file.name, await fetchFile(file));

        // Convertimos a MP3 ligero (128k)
        await ffmpeg.run("-i", file.name, "-b:a", "128k", "output.mp3");
        const data = ffmpeg.FS("readFile", "output.mp3");

        // Creamos el nuevo archivo optimizado
        const blob = new Blob([data.buffer], { type: "audio/mp3" });
        fileToUpload = new File([blob], "optimized_" + file.name.replace(/\.[^/.]+$/, "") + ".mp3", { type: "audio/mp3" });
        fileName = fileToUpload.name;

        setStatus("¡Optimización lista!");
        setProgress(50); 

      } catch (ffmpegError) {
        console.warn("⚠️ FFmpeg falló o no cargó. Usando archivo original.", ffmpegError);
        // Fallback silencioso: seguimos con el archivo original
        setStatus("Subiendo original (sin optimizar)...");
        fileToUpload = file; // Volvemos al original
      }

      // --- 2. SUBIDA A SUPABASE ---
      setStatus("Enviando a la nube...");
      
      const filePath = `uploads/${Date.now()}_${fileName}`;
      
      // Intentamos subir
      const { data, error: uploadError } = await supabase.storage
        .from('projects') // ⚠️ ESTE BUCKET DEBE EXISTIR EN SUPABASE
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Lanzamos el error específico de Supabase para verlo en el catch
        throw new Error(`Error Supabase: ${uploadError.message}`);
      }

      setProgress(100);
      setStatus("¡Completado!");
      
      // Éxito
      setTimeout(() => {
        alert("✅ Archivo subido correctamente.");
        if (onClose) onClose();
        window.location.reload(); 
      }, 500);

    } catch (error: any) {
      console.error("❌ ERROR DETALLADO:", error);
      // Mostramos el error real en pantalla
      alert(`FALLO LA SUBIDA:\n${error.message}`);
      setUploading(false);
      setStatus("Error - Intenta de nuevo");
    }
  };

  return (
    <div className="bg-[#0F1112] w-full max-w-md rounded-3xl border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-700" />
      
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
        {/* Zona de Carga */}
        <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors group">
           {file ? (
             <div className="text-center">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Music size={24} />
                </div>
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

        {/* Barra de Progreso */}
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