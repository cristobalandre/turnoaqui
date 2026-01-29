"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

// Definimos qué funciones podrá usar el padre
export interface AudioPlayerRef {
  getCurrentTime: () => string;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, { url: string }>(({ url }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");

  // Función auxiliar para formatear tiempo
  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ✅ ESTA ES LA MAGIA: Exponemos la función al padre
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
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      height: 96,
      normalize: true,
      url: url,
    });

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    wavesurfer.current.on("audioprocess", (t) => setCurrentTime(formatTime(t)));
    wavesurfer.current.on("ready", (d) => setDuration(formatTime(d)));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url]);

  const handlePlayPause = () => {
    wavesurfer.current?.playPause();
  };

  return (
    <div className="w-full bg-[#0F1112] border border-zinc-800 rounded-3xl p-6 shadow-xl relative group">
      <div className="mb-4 relative z-10 w-full" ref={containerRef} />

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-mono text-zinc-400 w-10">{currentTime}</span>
        
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

        <span className="text-xs font-mono text-zinc-400 w-10 text-right">{duration}</span>
      </div>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";