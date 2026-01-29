"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, User, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";

export default function NewArtistModal({ onClose }: { onClose?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert("El nombre es obligatorio");
    setUploading(true);

    try {
      let publicAvatarUrl = null;

      // 1. Subir Foto (Si existe)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('artists') // Asegúrate de haber corrido el SQL del Paso 1
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('artists').getPublicUrl(filePath);
        publicAvatarUrl = data.publicUrl;
      }

      // 2. Guardar en Base de Datos
      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase.from('artists').insert({
        name,
        bio,
        image_url: publicAvatarUrl,
        user_id: user?.id
      });

      if (dbError) throw dbError;

      // 3. Éxito
      if (onClose) onClose();
      window.location.reload();

    } catch (error: any) {
      console.error(error);
      alert("Error creando artista: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0F1112] w-full max-w-md rounded-3xl border border-zinc-800 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="text-amber-500" size={24} /> Nuevo Artista
        </h2>
        {onClose && (
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
        )}
      </div>

      <div className="space-y-4">
        {/* INPUT FOTO */}
        <div className="flex justify-center">
            <label className="cursor-pointer group relative w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-amber-500 flex items-center justify-center overflow-hidden transition-all">
                {file ? (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="text-zinc-600 group-hover:text-amber-500" size={24} />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
        </div>
        <p className="text-center text-xs text-zinc-500">Toca para subir foto</p>

        {/* INPUTS TEXTO */}
        <div className="space-y-3">
            <input 
                type="text" 
                placeholder="Nombre Artístico (ej. Bad Bunny)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <textarea 
                placeholder="Pequeña biografía o notas..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 transition-all h-24 resize-none"
            />
        </div>

        <button
          onClick={handleCreate}
          disabled={uploading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="animate-spin" /> : "Crear Artista"}
        </button>
      </div>
    </div>
  );
}