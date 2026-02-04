'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, StopCircle, Loader2, Music, Type, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { analyzeAudio } from '@/utils/audioAnalyzer'

export default function WitnessRecorder() {
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  
  const workerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // 1. Iniciamos el Worker (IMPORTANTE: type module para imports CDN)
    if (!workerRef.current) {
      workerRef.current = new Worker('/whisper.worker.js', { type: 'module' });
      
      workerRef.current.onmessage = (event) => {
        const { status, text, data } = event.data;
        if (status === 'loading') setStatus('loading');
        if (status === 'ready') setStatus('ready');
        if (status === 'complete') {
            setTranscription(prev => prev + " " + text);
            setStatus('ready');
        }
        if (status === 'error') console.error("Error Worker:", data);
      };

      workerRef.current.postMessage({ type: 'load' });
    }

    return () => {
        workerRef.current?.terminate();
        workerRef.current = null;
    };
  }, [])

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            setStatus('processing');
            const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
            
            // Procesar Audio
            const arrayBuffer = await blob.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // 1. Enviar a Whisper (Worker)
            const audioData = audioBuffer.getChannelData(0);
            workerRef.current?.postMessage({ type: 'transcribe', audio: audioData });

            // 2. Analizar Música (Essentia)
            try {
                const stats = await analyzeAudio(audioBuffer);
                setMusicStats(stats);
            } catch (err) {
                console.log("Audio muy corto o silencio.", err);
            }
        };

        mediaRecorderRef.current.start();
        setTranscription('');
        setMusicStats(null);
        setStatus('recording');
    } catch (err) {
        alert("Error: No se pudo acceder al micrófono.");
        console.error(err);
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Cabecera */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <div>
                <h2 className="text-white font-bold tracking-tight">Session Analyzer AI</h2>
                <p className="text-zinc-500 text-xs font-mono">
                    {status === 'loading' && "Descargando IA..."}
                    {status === 'ready' && "Sistema en espera"}
                    {status === 'recording' && "Escuchando..."}
                    {status === 'processing' && "Procesando..."}
                </p>
            </div>
          </div>
          <Button 
            onClick={status === 'recording' ? stopRecording : startRecording}
            disabled={status === 'loading' || status === 'processing'}
            className={status === 'recording' ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-black hover:bg-zinc-200'}
          >
              {status === 'recording' ? <StopCircle className="mr-2 h-4 w-4"/> : <Mic className="mr-2 h-4 w-4"/>}
              {status === 'recording' ? 'DETENER' : 'GRABAR'}
          </Button>
      </div>

      {/* Resultados */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {/* Columna Música */}
          <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-4">
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Datos Musicales</span>
              </div>
              {musicStats ? (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-xs uppercase">BPM</span>
                          <div className="text-3xl font-black text-white">{musicStats.bpm}</div>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-xs uppercase">Key</span>
                          <div className="text-3xl font-black text-emerald-400">{musicStats.key}</div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 bg-emerald-500/10 text-emerald-400 p-2 rounded border border-emerald-500/20 inline-flex items-center">
                          <Zap className="w-3 h-3 mr-1" /> Suggestion: Autotune {musicStats.key}
                      </div>
                  </div>
              ) : (
                  <div className="h-32 flex items-center justify-center text-zinc-700 text-sm italic">
                      Graba música para detectar BPM/Key...
                  </div>
              )}
          </div>

          {/* Columna Texto */}
          <div className="p-6 flex flex-col">
              <div className="flex items-center gap-2 text-zinc-400 mb-4">
                  <Type className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Transcripción</span>
              </div>
              <div className="flex-1 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 min-h-[200px]">
                  {transcription ? (
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in">
                          {transcription}
                      </p>
                  ) : (
                      <span className="text-zinc-700 text-sm italic">
                          La letra aparecerá aquí...
                      </span>
                  )}
              </div>
          </div>
      </div>
    </div>
  )
}