"use client";

import { useState } from "react";
// ✅ TODOS los imports arriba
import { Upload, Music, Loader2, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAudioProcessor } from "@/hooks/useAudioProcessor";

export default function NewProjectModal() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { compressAudio, isProcessing, progress } = useAudioProcessor();
  const [uploading, setUploading] = useState(false);
  
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // 1. Procesar Audio (Máquina Oculta)
      const fileToUpload = await compressAudio(selectedFile) || selectedFile;

      setUploading(true);
      // Usamos un nombre único
      const uniqueName = `${Date.now()}-${fileToUpload.name.replace(/\s+/g, '_')}`;
      
      // 2. Subir el archivo físico al Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files') 
        .upload(uniqueName, fileToUpload);

      if (uploadError) throw uploadError;

      // 3. ✅ GUARDAR EN BASE DE DATOS (Crucial para el borrado automático)
      // Necesitamos crear el registro para que el Cron Job sepa qué borrar en 3 días.
      /* Asegúrate de tener el ID del proyecto disponible aquí. 
         Si este modal está dentro de una página de proyecto, pásalo como prop: { projectId }
      */
      const { error: dbError } = await supabase.from('project_versions').insert({
        project_id: 'ID_DEL_PROYECTO_AQUI', // ⚠️ Reemplazar con el ID real o prop
        version_number: 1, // Calcular dinámicamente si puedes
        file_url: uniqueName, // Guardamos la ruta para poder borrarlo
        file_name: uniqueName, // Nombre exacto en el bucket
        description: 'Subida inicial'
      });

      if (dbError) console.error("Error guardando en DB:", dbError);

      alert("¡Audio optimizado y registrado con éxito!");

    } catch (error) {
      console.error(error);
      alert("Error en la subida.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold text-white mb-4">Subir Maqueta</h2>
      
      {/* Area de Drop */}
      <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center mb-6 relative">
        {selectedFile ? (
          <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg z-10 relative">
            <Music className="text-emerald-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB (Original)</p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-sm text-zinc-400">Arrastra tu WAV o MP3 aquí</p>
          </>
        )}
        <input type="file" onChange={handleFileSelect} accept="audio/*" className="hidden" id="audio-upload" />
        <label htmlFor="audio-upload" className="absolute inset-0 cursor-pointer" />
      </div>

      {/* Alerta de Zona Temporal */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
           <AlertTriangle size={20} />
        </div>
        <div>
           <h4 className="text-sm font-bold text-amber-400 mb-1">Zona Temporal (72h)</h4>
           <p className="text-xs text-zinc-400 leading-relaxed">
             El archivo se <strong className="text-zinc-200">autodestruirá en 3 días</strong> para ahorrar espacio.
           </p>
           <p className="text-[10px] text-amber-500/80 mt-2 font-mono flex items-center gap-1">
             <Clock size={10} />
             El cliente debe revisar antes de que expire.
           </p>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isProcessing || uploading}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Optimizando Audio... {progress}%</span>
          </>
        ) : uploading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Subiendo a la Nube...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Procesar y Subir</span>
          </>
        )}
      </button>
    </div>
  );
}