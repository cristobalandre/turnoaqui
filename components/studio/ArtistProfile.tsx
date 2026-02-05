'use client'

import React, { useState } from 'react'
// 👇 AQUÍ AGREGUÉ 'ExternalLink' QUE FALTABA
import { Play, Pause, Instagram, Music, Share2, Award, Zap, LayoutGrid, CheckCircle, ExternalLink } from 'lucide-react'

// Mockup de datos
const MOCK_IG_FEED = [
    { id: 1, img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop", type: "image" },
    { id: 2, img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop", type: "video" },
    { id: 3, img: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=300&auto=format&fit=crop", type: "image" },
];

const MOCK_HITS = [
    { title: "Midnight City", role: "Producer", streams: "1.2M", date: "2d ago" },
    { title: "Vibras (Remix)", role: "Songwriter", streams: "850k", date: "1w ago" },
    { title: "Neon Lights", role: "Engineer", streams: "45k", date: "3w ago" },
];

export default function ArtistProfile() {
  const [isPlaying, setIsPlaying] = useState(false);

  const MetallicBadge = ({ icon: Icon, label }: any) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/10 shadow-lg shadow-black/50">
        <Icon size={12} className="text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{label}</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
        
        {/* --- HEADER --- */}
        <div className="relative group rounded-[2.5rem] p-1 bg-gradient-to-br from-white/10 to-white/0 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl -z-10" />
            
            <div className="bg-[#09090b] rounded-[2.3rem] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                
                {/* Avatar */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-900 shadow-2xl overflow-hidden relative z-10">
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full blur-xl opacity-60 animate-pulse-slow" />
                    <div className="absolute bottom-0 right-0 z-20 bg-black p-1.5 rounded-full border border-zinc-800">
                        <CheckCircle size={16} className="text-emerald-500 fill-emerald-500/20" />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">BAD BUNNY</h1>
                        <p className="text-zinc-400 text-sm font-medium">San Juan, PR • Productor & Artista</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <MetallicBadge icon={Award} label="Top 100 Global" />
                        <MetallicBadge icon={Zap} label="Verified Pro" />
                    </div>

                    {/* Signature Sound */}
                    <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 backdrop-blur-sm mt-2">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1"/>}
                        </button>
                        <div className="flex-1 space-y-1">
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full bg-indigo-500 w-1/2 ${isPlaying ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                <span>SIGNATURE SOUND</span>
                                <span>0:15 / 0:30</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Socials */}
                <div className="flex flex-col gap-3">
                    <button className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-pink-500/50 transition-all group">
                        <Instagram size={20} />
                    </button>
                    <button className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-black transition-all group">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    </button>
                    <button className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-indigo-500 transition-all">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* --- LATEST VIBES --- */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Instagram size={12} className="text-pink-500" /> Latest Vibes (Auto-Import)
                </h3>
                <span className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-800">
                    Sync: Active
                </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 h-48 md:h-64">
                {MOCK_IG_FEED.map((post) => (
                    <div key={post.id} className="relative group rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 cursor-pointer">
                        <img src={post.img} alt="IG Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                                Ver en Instagram <ExternalLink size={10} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- TRACK RECORD --- */}
        <div className="bg-[#09090b] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
                <Music size={16} className="text-emerald-500" />
                <h3 className="text-white text-sm font-bold uppercase tracking-widest">Historial de Batalla</h3>
            </div>

            <div className="space-y-1">
                {MOCK_HITS.map((hit, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="text-zinc-600 font-mono text-xs w-4">{i + 1}</span>
                            <div>
                                <h4 className="text-white text-sm font-bold">{hit.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                                        {hit.role}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{hit.date}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-white text-xs font-mono font-bold">{hit.streams}</div>
                            <span className="text-[10px] text-zinc-600 uppercase">Plays</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs hover:text-white hover:border-zinc-600 transition-all uppercase tracking-widest">
                Ver todos los proyectos
            </button>
        </div>

    </div>
  )
}