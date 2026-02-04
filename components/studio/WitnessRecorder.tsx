'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, StopCircle, Music, Type, Zap, AlertTriangle, Wifi, Share, Copy, CloudUpload, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logToConsole } from '@/utils/remoteLogger'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient();

export default function WitnessRecorder() {
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Estado para el Audio Final y Subida
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  // Referencias
  const musicWorkerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null) // 👈 El grabador comprimido
  const chunksRef = useRef<Blob[]>([]) // 👈 Aquí guardamos lo comprimido
  
  // Referencias para Análisis (BPM/Key)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rawAudioBufferRef = useRef<Float32Array[]>([]) // 👈 Buffer temporal solo para BPM

  useEffect(() => {
    // 1. WORKER MUSICAL (Essentia)
    if (!musicWorkerRef.current) {
        musicWorkerRef.current = new Worker('/music.worker.js');
        musicWorkerRef.current.onmessage = (event) => {
            const { type, bpm, key, message } = event.data;
            if (type === 'result') setMusicStats({ bpm, key });
            if (type === 'error') logToConsole("⚠️ Música:", message);
        };
        musicWorkerRef.current.postMessage({ type: 'init' });
    }

    return () => {
        musicWorkerRef.current?.terminate();
        stopRecording();
    };
  }, [])

  const startRecording = async () => {
    setErrorMessage('');
    setMusicStats(null);
    setAudioBlob(null);
    setUploadStatus('idle');
    chunksRef.current = [];
    rawAudioBufferRef.current = [];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // --- SISTEMA 1: GRABACIÓN COMPRIMIDA (Para Guardar/Texto) ---
        // Detectamos el mejor formato (iPhone ama mp4, Chrome ama webm)
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4'; // Safari / iPhone
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
        }
        
        logToConsole(`Usando compresión: ${mimeType}`);

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start(1000); // Guardar trozos cada 1s

        // --- SISTEMA 2: ANÁLISIS RAW (Solo para BPM en tiempo real) ---
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        // ScriptProcessor solo para "escuchar" el ritmo, no para grabar el archivo final
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Guardamos copia ligera para análisis
            rawAudioBufferRef.current.push(new Float32Array(inputData));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setStatus('recording');
        logToConsole("🎙️ Grabando (Híbrido)...");

    } catch (err: any) {
        alert("Error: " + err.message);
        logToConsole("Error Start:", err.message);
    }
  }

  const stopRecording = async () => {
    if (status !== 'recording') return;
    
    // Detener grabación comprimida
    mediaRecorderRef.current?.stop();
    
    // Detener procesamiento RAW
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();

    setStatus('processing');

    // Esperar un momento a que MediaRecorder termine de cerrar el archivo
    setTimeout(async () => {
        // 1. CREAR ARCHIVO COMPRIMIDO FINAL 📦
        // Esto crea un archivo .mp4 o .webm real y pequeño
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        
        const sizeKB = (finalBlob.size / 1024).toFixed(2);
        logToConsole(`Archivo generado: ${mimeType}, Tamaño: ${sizeKB} KB`);

        // 2. ENVIAR A GROQ (Texto) 🧠
        // Enviamos el Blob comprimido directo (Groq lo soporta y es más rápido subirlo)
        const formData = new FormData();
        // Le ponemos extensión correcta para que Groq no se queje
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        formData.append('file', finalBlob, `audio.${ext}`);

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.text) {
                setTranscription(prev => (prev ? prev + " " : "") + data.text);
            }
        } catch (e: any) {
            logToConsole("Error Transcripción:", e.message);
        }

        // 3. ENVIAR A ESSENTIA (Música) 🎵
        // Para música seguimos usando los datos RAW que capturamos por el otro canal
        const totalLength = rawAudioBufferRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const fullRawBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of rawAudioBufferRef.current) {
            fullRawBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        
        if (musicWorkerRef.current) {
            musicWorkerRef.current.postMessage({ type: 'analyze', audio: fullRawBuffer });
        }

        setStatus('ready');
    }, 500);
  }

  // ☁️ SUBIDA INTELIGENTE A SUPABASE
  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploadStatus('uploading');

    try {
        // Detectar extensión correcta
        const isMp4 = audioBlob.type.includes('mp4');
        const ext = isMp4 ? 'm4a' : 'webm';
        const fileName = `demo_${Date.now()}.${ext}`;
        
        const { data, error } = await supabase.storage
            .from('demos')
            .upload(fileName, audioBlob, {
                contentType: audioBlob.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        logToConsole(`✅ Subido: ${fileName} (${(audioBlob.size/1024).toFixed(1)} KB)`);
        setUploadStatus('done');

    } catch (err: any) {
        alert("Error subiendo: " + err.message);
        setUploadStatus('idle');
    }
  };

  const handleShare = async () => {
    const textToShare = `🎵 IDEA:\n${transcription}\n\nBPM: ${musicStats?.bpm || '-'}`;
    
    // Fix TypeScript error
    if ((navigator as any).share) {
      await (navigator as any).share({ title: 'Studio Idea', text: textToShare });
    } else {
      navigator.clipboard.writeText(textToShare);
      alert("Copiado!");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* HEADER */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <div>
                <h2 className="text-white font-bold tracking-tight">Session Analyzer AI</h2>
                <div className="flex gap-2 text-zinc-500 text-xs font-mono items-center">
                    {status === 'recording' ? "REC (Compresor Activado)..." : "Listo"}
                    
                    {status === 'ready' && audioBlob && (
                        <button 
                            onClick={handleUpload}
                            disabled={uploadStatus !== 'idle'}
                            className={`ml-2 px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                                uploadStatus === 'done' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            }`}
                        >
                            {uploadStatus === 'uploading' && <Wifi className="animate-pulse w-3 h-3" />}
                            {uploadStatus === 'done' && <Check className="w-3 h-3" />}
                            {uploadStatus === 'idle' && <CloudUpload className="w-3 h-3" />}
                            {uploadStatus === 'idle' ? 'Guardar' : uploadStatus === 'done' ? 'Guardado' : 'Subiendo...'}
                        </button>
                    )}
                </div>
            </div>
          </div>
          
          <Button 
            onClick={status === 'recording' ? stopRecording : startRecording}
            disabled={status === 'processing'}
            className={status === 'recording' ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-black hover:bg-zinc-200'}
          >
              {status === 'recording' ? <StopCircle className="mr-2 h-4 w-4"/> : <Mic className="mr-2 h-4 w-4"/>}
              {status === 'recording' ? 'STOP' : 'REC'}
          </Button>
      </div>

      {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-red-400 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-3 h-3" /> {errorMessage}
          </div>
      )}

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
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
                  </div>
              ) : (
                  <div className="h-32 flex items-center justify-center text-zinc-700 text-sm italic">
                      ...
                  </div>
              )}
          </div>

          <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-zinc-400">
                      <Type className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Transcripción</span>
                  </div>
                  <button onClick={handleShare} disabled={!transcription} className="text-[10px] bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition-colors">
                    Copiar / Notas
                  </button>
              </div>
              <textarea 
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="flex-1 w-full bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 text-zinc-300 text-sm font-mono focus:outline-none resize-none min-h-[200px]"
              />
          </div>
      </div>
    </div>
  )
}