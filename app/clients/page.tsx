"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, Search, Plus, Mail, Phone, 
  MoreHorizontal, ArrowLeft, Camera, 
  Trash2, Edit3, MessageSquare 
} from "lucide-react";
import Link from "next/link";

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";
const BUCKET = "avatars";

type ClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  notes: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? clients.filter(c => 
      c.full_name.toLowerCase().includes(q) || 
      (c.phone || "").includes(q) || 
      (c.email || "").toLowerCase().includes(q)
    ) : clients;
  }, [clients, search]);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id,full_name,phone,email,avatar_url,notes")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: false });
    if (data) setClients(data as ClientRow[]);
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  const saveClient = async () => {
    if (!fullName.trim()) return;
    const payload = { 
      org_id: ORG_ID, 
      full_name: fullName.trim(), 
      phone: phone.trim() || null, 
      email: email.trim() || null, 
      notes: notes.trim() || null 
    };

    const { error } = editing 
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert([payload]);

    if (!error) { setModalOpen(false); loadClients(); }
  };

  const onPickAvatar = async (file: File, clientId: string) => {
    const path = `clients/${clientId}.${file.name.split(".").pop()}`;
    await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    await supabase.from("clients").update({ avatar_url: data.publicUrl }).eq("id", clientId);
    loadClients();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-8 font-sans relative overflow-hidden">
      {/* 🟢 AURA ESMERALDA */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors mb-4 text-zinc-500">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h1 className="text-3xl font-light text-white tracking-tight">Base de <span className="text-zinc-600 italic">Clientes</span></h1>
          </div>

          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, tel..."
                className="pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 outline-none w-64 transition-all"
              />
            </div>
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-emerald-400 transition-all text-xs font-bold shadow-2xl flex items-center gap-2">
              <Plus className="h-4 w-4" /> NUEVO CLIENTE
            </button>
          </div>
        </div>

        {/* GRID DE CLIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-20 text-xs tracking-widest animate-pulse">SINCRONIZANDO DATA DE CLIENTES...</div>
          ) : filteredClients.map((c) => (
            <div key={c.id} className="group bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden border border-zinc-800 group-hover:border-emerald-500/50 transition-all">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} className="h-full w-full object-cover" alt={c.full_name} />
                  ) : (
                    <div className="h-full w-full bg-zinc-800/50 flex items-center justify-center text-sm font-bold text-zinc-500 uppercase">
                      {c.full_name.substring(0,2)}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="h-4 w-4 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onPickAvatar(e.target.files[0], c.id)} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-base truncate">{c.full_name}</h3>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {c.phone && <span className="text-[10px] text-zinc-500 flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.phone}</span>}
                    {c.email && <span className="text-[10px] text-zinc-500 flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</span>}
                  </div>
                </div>
              </div>

              {c.notes && (
                <div className="mb-4 p-3 rounded-xl bg-zinc-800/20 border border-zinc-700/20 text-[10px] text-zinc-500 italic flex gap-2">
                  <MessageSquare className="h-3 w-3 shrink-0" />
                  <p className="line-clamp-2">{c.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
                <button onClick={() => { setEditing(c); setModalOpen(true); }} className="flex-1 py-2 rounded-lg bg-zinc-800/40 text-zinc-400 hover:text-white border border-zinc-700/30 text-[10px] font-bold transition-all">EDITAR</button>
                <button onClick={() => { if(confirm("¿Eliminar?")) supabase.from("clients").delete().eq("id", c.id).then(() => loadClients()); }} className="p-2 rounded-lg bg-zinc-800/40 text-zinc-600 hover:text-red-400 border border-zinc-700/30 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL (Look Gemini) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
          <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />
            <h2 className="text-xl text-white font-light mb-6 tracking-tight">{editing ? 'Actualizar' : 'Registrar'} <span className="text-zinc-600">Cliente</span></h2>
            
            <div className="space-y-4">
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre completo" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp / Teléfono" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none" />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white h-24 focus:border-emerald-500/50 outline-none resize-none" />
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-zinc-900 text-zinc-500 text-xs font-bold border border-zinc-800 hover:text-white transition-all uppercase">Cancelar</button>
                <button onClick={saveClient} className="flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-emerald-400 transition-all uppercase">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}