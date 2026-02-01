"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Box, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Check, 
  X, 
  Monitor, 
  Layers
} from "lucide-react";
import Link from "next/link";
// IMPORTANTE: Asegúrate de que esta ruta sea correcta en tu proyecto
import { supabase } from "@/lib/supabaseClient"; 

// Usamos el ID fijo que sabemos que funciona por ahora
const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";

type Room = {
  id: string;
  name: string;
  org_id: string;
  created_at?: string;
};

export default function ResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]); // Empezamos vacío, llenamos desde BD
  
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const canAdd = useMemo(() => newName.trim().length >= 2, [newName]);

  // 1. CARGAR DATOS REALES (READ)
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setRooms(data);
    } catch (error) {
      console.error("Error al cargar salas:", error);
    } finally {
      setLoading(false);
    }
  }

  // 2. GUARDAR EN SUPABASE (CREATE)
  async function addRoom() {
    if (!canAdd) return;
    
    try {
      // Enviamos a la BD
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          { 
            name: newName.trim(),
            org_id: ORG_ID // Enviamos el ID fijo para asegurar
          }
        ])
        .select(); // El .select() es vital para recuperar el ID real generado

      if (error) throw error;

      if (data) {
        setRooms([...rooms, ...data]);
        setNewName("");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar. Revisa la consola.");
    }
  }

  // 3. ACTUALIZAR EN SUPABASE (UPDATE)
  async function saveEdit(roomId: string) {
    if (editingName.trim().length < 2) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ name: editingName.trim() })
        .eq('id', roomId);

      if (error) throw error;

      // Actualizamos localmente solo si la BD respondió bien
      const updatedRooms = rooms.map(r => 
        r.id === roomId ? { ...r, name: editingName.trim() } : r
      );
      setRooms(updatedRooms);
      setEditingId(null);
    } catch (error) {
      console.error("Error al editar:", error);
    }
  }

  // 4. BORRAR EN SUPABASE (DELETE)
  async function deleteRoom(roomId: string) {
    if (!confirm("¿Eliminar este recurso?")) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      // Actualizamos localmente
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }

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
            <h1 className="text-3xl font-light text-white tracking-tight">Gestión de <span className="text-zinc-600 italic">Recursos</span></h1>
          </div>
        </div>

        {/* BARRA DE CREACIÓN TÉCNICA */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl mb-8 flex gap-4 items-center backdrop-blur-sm shadow-2xl">
          <div className="flex-1 bg-zinc-800/30 rounded-xl px-4 py-3 border border-zinc-700/30 focus-within:border-emerald-500/50 transition-all">
            <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1 font-bold">Nuevo Espacio / Box / Sala</label>
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-zinc-500" />
              <input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addRoom()} 
                placeholder="Ej: Estudio de Grabación A" 
                className="bg-transparent border-none p-0 w-full text-white text-sm focus:ring-0 placeholder:text-zinc-700" 
              />
            </div>
          </div>
          <button 
            onClick={addRoom} 
            disabled={!canAdd} 
            className={`px-8 py-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${canAdd ? 'bg-white text-black hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}`}
          >
            <Plus className="h-4 w-4" /> AGREGAR
          </button>
        </div>

        {/* LISTADO DE RECURSOS */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20 text-xs tracking-[0.3em] animate-pulse text-emerald-500/50 font-bold">CONECTANDO A BASE DE DATOS...</div>
          ) : rooms.map((room) => (
            <div key={room.id} className="group bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* ICONO CON GLOW */}
                  <div className="h-14 w-14 rounded-2xl bg-zinc-800/30 flex items-center justify-center border border-zinc-700/20 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-all duration-500">
                    <Monitor className="h-6 w-6 text-zinc-500 group-hover:text-emerald-400" />
                  </div>
                  
                  {editingId === room.id ? (
                    <div className="flex items-center gap-3">
                      <input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        autoFocus
                        className="bg-zinc-800/50 border border-emerald-500/50 rounded-xl px-4 py-2 text-white text-sm focus:ring-0" 
                      />
                      <button onClick={() => saveEdit(room.id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/40 transition-colors"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium text-xl tracking-tight">{room.name}</h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 tracking-widest font-bold">DISPONIBLE</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mt-1.5 font-medium">Capacidad de Agenda Activa</p>
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(room.id); setEditingName(room.name); }} className="p-3 bg-zinc-800/40 text-zinc-500 hover:text-white rounded-xl border border-zinc-700/30 transition-all">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteRoom(room.id)} className="p-3 bg-zinc-800/40 text-zinc-500 hover:text-red-400 rounded-xl border border-zinc-700/30 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && !loading && (
          <div className="border border-dashed border-zinc-800 rounded-3xl py-24 text-center">
            <Box className="h-10 w-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 text-sm italic">No se encontraron recursos en la base de datos.</p>
          </div>
        )}
      </div>
    </div>
  );
}