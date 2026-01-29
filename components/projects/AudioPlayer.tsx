"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import Image from "next/image";

// Definimos la estructura de un comentario para los marcadores
type CommentMarker = {
  id: string;
  avatar_url: string;
  timestamp: string; // formato "MM:SS"
  content: string;
};

export interface AudioPlayerRef {
  getCurrentTime: () => string;
}

interface AudioPlayerProps {
  url: string;
  comments?: CommentMarker[]; // Recibimos los comentarios
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ url, comments = [] }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Guardamos numérico para cálculos
  const [totalDuration, setTotalDuration] = useState(0);

  // Convertir "MM:SS" a segundos
  const parseTime = (timeStr: string) => {
    const [mins, secs] = timeStr.split(":").map(Number);
    return (mins * 60) + secs;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      const time = wavesurfer.current?.getCurrentTime() || 0;
      return formatTime(time);
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#52525b",
      progressColor: "#f59e0b",
      cursorColor: "#fff",
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 120, // Un poco mas altito para las fotos
      normalize: true,
      url: url,
    });

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    wavesurfer.current.on("audioprocess", (t) => setCurrentTime(t));
    wavesurfer.current.on("ready", (d) => setTotalDuration(d));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url]);

  const handlePlayPause = () => {
    wavesurfer.current?.playPause();
  };

  return (
    <div className="w-full bg-[#0F1112] border border-zinc-800 rounded-3xl p-6 shadow-xl relative group">
      
      {/* CONTENEDOR DE ONDA Y MARCADORES */}
      <div className="relative mb-4">
        {/* Onda */}
        <div ref={containerRef} className="z-10 relative" />

        {/* MARCADORES TIPO SOUNDCLOUD */}
        {totalDuration > 0 && comments.map((comment) => {
          const seconds = parseTime(comment.timestamp);
          const leftPercent = (seconds / totalDuration) * 100;

          // Solo mostramos si el tiempo es válido
          if (isNaN(leftPercent) || leftPercent < 0 || leftPercent > 100) return null;

          return (
            <div 
              key={comment.id}
              className="absolute top-1/2 -translate-y-1/2 z-20 group/marker cursor-pointer hover:z-30 transition-all hover:scale-125"
              style={{ left: `${leftPercent}%` }}
              title={comment.content}
            >
              {/* Línea vertical */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[1px] h-full bg-amber-500/50 pointer-events-none" />
              
              {/* Avatar Flotante */}
              <div className="w-5 h-5 rounded-full border border-amber-500 overflow-hidden relative shadow-lg shadow-amber-500/20 bg-zinc-900">
                <Image 
                  src={comment.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=?"} 
                  alt="User" 
                  fill 
                  className="object-cover"
                />
              </div>

              {/* Tooltip al pasar el mouse */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none shadow-xl">
                 {comment.content.slice(0, 20)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLES */}
      <div className="flex items-center justify-between mt-4 border-t border-zinc-800/50 pt-4">
        <span className="text-xs font-mono text-zinc-400 w-10">{formatTime(currentTime)}</span>
        
        <div className="flex items-center gap-4">
           <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => wavesurfer.current?.skip(-5)}>
             <SkipBack size={20} />
           </button>
           
           <button 
             onClick={handlePlayPause}
             className="w-12 h-12 bg-white hover:bg-zinc-200 rounded-full flex items-center justify-center text-black transition-transform active:scale-95 shadow-lg shadow-white/10"
           >
              {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
           </button>

           <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => wavesurfer.current?.skip(5)}>
             <SkipForward size={20} />
           </button>
        </div>

        <span className="text-xs font-mono text-zinc-400 w-10 text-right">{formatTime(totalDuration)}</span>
      </div>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";