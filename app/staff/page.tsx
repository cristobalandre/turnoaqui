"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, Mail, Plus, Edit3, Trash2, ArrowLeft, 
  Camera, Check, X, Briefcase, ZoomIn 
} from "lucide-react";
import Link from "next/link";

// --- CONFIGURACIÓN FIJA ---
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";
const BUCKET = "Avatars";
const THUMB_SIZE = 512;
const FULL_SIZE = 1024;

type Staff = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  avatar_thumb_url?: string | null;
  avatar_full_url?: string | null;
};

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState("staff");
  const [editingActive, setEditingActive] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const roleLabel = useMemo(() => ({
    producer: "Productor",
    artist: "Artista",
    barber: "Barbero",
    staff: "Staff",
  }), []);

  // --- LÓGICA DE CARGA Y PROCESAMIENTO (TU CÓDIGO ORIGINAL MEJORADO) ---
  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("staff")
      .select("id,name,role,active,avatar_thumb_url,avatar_full_url")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: true });
    if (data) setItems(data as Staff[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCroppedWebp = async (file: File, size: number) => {
    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imgUrl;
    await new Promise((res) => (img.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx?.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return new Promise<File>((res) => canvas.toBlob((b) => res(new File([b!], "a.webp")), "image/webp", 0.92));
  };

  const handleAvatarUpload = async (staffId: string, file: File) => {
    try {
      const thumb = await createCroppedWebp(file, THUMB_SIZE);
      const full = await createCroppedWebp(file, FULL_SIZE);
      const pathThumb = `${ORG_ID}/staff/${staffId}/avatar-512.webp`;
      const pathFull = `${ORG_ID}/staff/${staffId}/avatar-1024.webp`;

      await supabase.storage.from(BUCKET).upload(pathThumb, thumb, { upsert: true });
      await supabase.storage.from(BUCKET).upload(pathFull, full, { upsert: true });

      const thumbUrl = supabase.storage.from(BUCKET).getPublicUrl(pathThumb).data.publicUrl;
      const fullUrl = supabase.storage.from(BUCKET).getPublicUrl(pathFull).data.publicUrl;

      await supabase.from("staff").update({
        avatar_thumb_url: `${thumbUrl}?t=${Date.now()}`,
        avatar_full_url: `${fullUrl}?t=${Date.now()}`,
      }).eq("id", staffId);
      load();
    } catch (e) { alert("Error al subir avatar"); }
  };

  const addStaff = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await supabase.from("staff").insert([{ name: newName, role: newRole, org_id: ORG_ID, active: true }]);
    setNewName(""); load(); setSaving(false);
  };

  // --- RENDEREADO ---
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-8 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors mb-4 text-zinc-500">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h1 className="text-3xl font-light text-white tracking-tight">Gestión de <span className="text-zinc-600 italic">Staff</span></h1>
          </div>
          
          <div className="flex gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/50">
            <input 
              value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nombre del nuevo integrante"
              className="bg-transparent border-none focus:ring-0 text-sm text-white px-3 w-48"
            />
            <select 
              value={newRole} onChange={e => setNewRole(e.target.value)}
              className="bg-zinc-800/50 border-none rounded-lg text-xs text-zinc-300 focus:ring-0"
            >
              <option value="producer">Productor</option>
              <option value="artist">Artista</option>
              <option value="barber">Barbero</option>
              <option value="staff">Staff</option>
            </select>
            <button onClick={addStaff} disabled={saving} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors">
              {saving ? '...' : 'Agregar'}
            </button>
          </div>
        </div>

        {/* GRID DE STAFF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <div key={s.id} className="group bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  {/* AVATAR CON HOVER ZOOM */}
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-emerald-500/50 transition-all">
                    {s.avatar_thumb_url ? (
                      <img src={s.avatar_thumb_url} className="h-full w-full object-cover" alt={s.name} />
                    ) : (
                      <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-600">
                        {s.name[0]}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleAvatarUpload(s.id, e.target.files[0])} />
                    </label>
                  </div>

                  <div>
                    <h3 className="text-white font-medium text-lg flex items-center gap-2">
                      {s.name}
                      <span className={`h-1.5 w-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> {roleLabel[s.role as keyof typeof roleLabel]}
                    </p>
                  </div>
                </div>

                {/* ACCIONES MINIMALISTAS */}
                <div className="flex gap-2">
                  {s.avatar_full_url && (
                    <button onClick={() => setPreviewUrl(s.avatar_full_url!)} className="p-2.5 bg-zinc-800/40 text-zinc-500 hover:text-white rounded-xl border border-zinc-700/30 transition-all">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setEditingId(s.id)} className="p-2.5 bg-zinc-800/40 text-zinc-500 hover:text-white rounded-xl border border-zinc-700/30 transition-all">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => supabase.from("staff").delete().eq("id", s.id).then(() => load())} className="p-2.5 bg-zinc-800/40 text-zinc-500 hover:text-red-400 rounded-xl border border-zinc-700/30 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE PREVIEW (GEMINI STYLE) */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} className="w-full rounded-2xl" alt="Preview" />
            <button onClick={() => setPreviewUrl(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}