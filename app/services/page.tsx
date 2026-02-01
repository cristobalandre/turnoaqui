"use client";

import { useEffect, useState } from "react";
// Asegúrate de que esta ruta sea la correcta en tu proyecto
import { supabase } from "@/lib/supabaseClient"; 
import { 
  Scissors, Clock, DollarSign, Plus, 
  Edit3, Trash2, ArrowLeft, Check, X, 
  Settings2
} from "lucide-react";
import Link from "next/link";

// Tu ID de organización fijo
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Nuevo
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDuration, setEditingDuration] = useState<number>(30);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingActive, setEditingActive] = useState(true);

  // FUNCIÓN DE CARGA (READ)
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id,name,duration_minutes,price,active")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: true });
      
    if (error) console.error("Error cargando servicios:", error);
    if (data) setItems(data as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // FUNCIÓN DE AGREGAR (CREATE)
  const add = async () => {
    if (!newName.trim() || newDuration <= 0) return;
    setSaving(true);
    
    const { error } = await supabase.from("services").insert([{
      org_id: ORG_ID, 
      name: newName.trim(), 
      duration_minutes: Number(newDuration),
      price: Number(newPrice), 
      active: true,
    }]);

    if (!error) { 
      setNewName(""); 
      setNewDuration(30); 
      setNewPrice(0); 
      load(); 
    } else {
      console.error("Error creando servicio:", error);
    }
    setSaving(false);
  };

  // FUNCIÓN DE EDITAR (UPDATE)
  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    
    const { error } = await supabase.from("services").update({
      name: editingName.trim(), 
      duration_minutes: Number(editingDuration),
      price: Number(editingPrice), 
      active: editingActive,
    }).eq("id", editingId);

    if (!error) { 
      setEditingId(null); 
      load(); 
    } else {
      console.error("Error actualizando:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-8 font-sans relative overflow-hidden">
      {/* 🟢 AURA ESMERALDA */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors mb-4 text-zinc-500">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h1 className="text-3xl font-light text-white tracking-tight">Catálogo de <span className="text-zinc-600 italic">Servicios</span></h1>
          </div>
        </div>

        {/* BARRA DE CREACIÓN */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl mb-8 flex flex-wrap gap-4 items-center backdrop-blur-sm shadow-2xl">
          <div className="flex-1 min-w-[200px] bg-zinc-800/30 rounded-xl px-4 py-2 border border-zinc-700/30">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1 font-bold">Nombre del Servicio</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Grabación Voz" className="bg-transparent border-none p-0 w-full text-white text-sm focus:ring-0 placeholder:text-zinc-700" />
          </div>
          <div className="w-32 bg-zinc-800/30 rounded-xl px-4 py-2 border border-zinc-700/30">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1 font-bold">Minutos</label>
            <input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} className="bg-transparent border-none p-0 w-full text-white text-sm focus:ring-0" />
          </div>
          <div className="w-32 bg-zinc-800/30 rounded-xl px-4 py-2 border border-zinc-700/30">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1 font-bold">Precio ($)</label>
            <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="bg-transparent border-none p-0 w-full text-white text-sm focus:ring-0" />
          </div>
          <button onClick={add} disabled={saving} className="bg-white text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> {saving ? '...' : 'AÑADIR'}
          </button>
        </div>

        {/* LISTADO */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-xs tracking-[0.3em] animate-pulse text-emerald-500/50 font-bold">SINCRONIZANDO SERVICIOS...</div>
          ) : items.map((s) => (
            <div key={s.id} className="group bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-lg">
              {editingId === s.id ? (
                // MODO EDICIÓN
                <div className="flex flex-wrap gap-4 items-end w-full">
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-1 bg-zinc-800/50 border border-emerald-500/50 rounded-xl p-3 text-white text-sm" />
                  <input type="number" value={editingDuration} onChange={e => setEditingDuration(Number(e.target.value))} className="w-24 bg-zinc-800/50 border border-emerald-500/50 rounded-xl p-3 text-white text-sm" />
                  <input type="number" value={editingPrice} onChange={e => setEditingPrice(Number(e.target.value))} className="w-24 bg-zinc-800/50 border border-emerald-500/50 rounded-xl p-3 text-white text-sm" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/40"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-3 bg-zinc-800 text-zinc-400 rounded-xl"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : (
                // MODO VISTA
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-zinc-800/30 flex items-center justify-center border border-zinc-700/20 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-all">
                      <Settings2 className="h-6 w-6 text-zinc-500 group-hover:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium text-lg tracking-tight">{s.name}</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider ${s.active ? 'border border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border border-red-500/30 text-red-400 bg-red-500/5'}`}>
                          {s.active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500 uppercase tracking-wider font-medium">
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {s.duration_minutes} min</span>
                        <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> ${s.price}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(s.id); setEditingName(s.name); setEditingDuration(s.duration_minutes); setEditingPrice(s.price); setEditingActive(s.active); }} className="p-3 bg-zinc-800/40 text-zinc-500 hover:text-white rounded-xl border border-zinc-700/30 transition-all">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => supabase.from("services").delete().eq("id", s.id).then(() => load())} className="p-3 bg-zinc-800/40 text-zinc-500 hover:text-red-400 rounded-xl border border-zinc-700/30 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {items.length === 0 && !loading && (
           <div className="text-center py-20 text-zinc-600 text-sm italic">No hay servicios creados aún.</div>
        )}
      </div>
    </div>
  );
}