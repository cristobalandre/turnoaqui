"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { ArrowLeft, Plus, Search, Users, Mic2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NewArtistModal from "@/components/artists/NewArtistModal";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export default function ArtistsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
    if (data) setArtists(data);
    setLoading(false);
  };

  const filteredArtists = artists.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-300 ${outfit.className} p-6 pb-20 md:p-10 relative`}>
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800">
              <ArrowLeft size={20} className="text-white" />
            </Link>
            <div>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Gestión</p>
               <h1 className="text-3xl font-bold text-white">Artistas</h1>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all"
          >
            <Plus size={18} /> <span>Nuevo</span>
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
            type="text" 
            placeholder="Buscar artista..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-all"
            />
        </div>

        {/* GRID DE ARTISTAS */}
        {loading ? (
           <div className="text-center text-zinc-500 py-20">Cargando Roster...</div>
        ) : filteredArtists.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl">
              <Users className="text-zinc-600 mb-4" size={40} />
              <p className="text-zinc-400">No hay artistas aún.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredArtists.map((artist) => (
              <div key={artist.id} className="group relative bg-[#0F1112] border border-zinc-800 rounded-3xl p-4 flex flex-col items-center hover:border-amber-500/50 transition-all hover:-translate-y-1">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-amber-500 transition-all mb-4 relative">
                   {artist.image_url ? (
                     <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                   ) : (
                     <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500"><Mic2 /></div>
                   )}
                </div>
                <h3 className="text-white font-bold text-center truncate w-full">{artist.name}</h3>
                <p className="text-xs text-zinc-500 text-center line-clamp-2 mt-1">{artist.bio || "Sin biografía"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
           <div className="relative z-10 w-full max-w-md">
              <NewArtistModal onClose={() => { setIsModalOpen(false); fetchArtists(); }} />
           </div>
        </div>
      )}
    </div>
  );
}