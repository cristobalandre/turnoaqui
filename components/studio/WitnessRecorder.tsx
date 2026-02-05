'use client'

import React, { useState, useEffect, useRef } from 'react'
// 1. AGREGAMOS 'ExternalLink' A LOS ICONOS
import { Mic, StopCircle, Music, Type, Zap, AlertTriangle, Wifi, Share, Copy, CloudUpload, Check, FolderOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logToConsole } from '@/utils/remoteLogger'
import { createClient } from '@/lib/supabase/client'
// 2. IMPORTAMOS EL ROUTER PARA PODER NAVEGAR
import { useRouter } from 'next/navigation'

const supabase = createClient();

export default function WitnessRecorder() {
  const router = useRouter(); // 👈 Inicializamos el router
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const musicWorkerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rawAudioBufferRef = useRef<Float32Array[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;

        const { data } = await supabase
            .from('projects')
            .select('id, name')
            .order('created_at', { ascending: false });
        
        if (data) {
            setProjects(data);
            if (data.length > 0) setSelectedProjectId(data[0].id);
        }
    };
    fetchProjects();

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

        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4'; 
        }
        
        logToConsole(`Usando compresión: ${mimeType}`);

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start(1000);

        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
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
    
    mediaRecorderRef.current?.stop();
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();

    setStatus('processing');

    setTimeout(async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        
        const sizeKB = (finalBlob.size / 1024).toFixed(2);
        logToConsole(`Archivo generado: ${mimeType}, Tamaño: ${sizeKB} KB`);

        const formData = new FormData();
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

  const handleUpload = async () => {
    if (!audioBlob) return;
    if (!selectedProjectId) {
        alert("⚠️ Por favor selecciona un proyecto para guardar esta idea.");
        return;
    }

    setUploadStatus('uploading');

    try {
        const isMp4 = audioBlob.type.includes('mp4');
        const ext = isMp4 ? 'm4a' : 'webm';
        const fileName = `${selectedProjectId}/${Date.now()}_demo.${ext}`;
        
        const { data, error } = await supabase.storage
            .from('demos')
            .upload(fileName, audioBlob, {
                contentType: audioBlob.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('demos').getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('project_ideas')
            .insert({
                project_id: selectedProjectId,
                file_url: publicUrl,
                transcription: transcription,
                bpm: musicStats?.bpm || 0,
                music_key: musicStats?.key || '',
                name: `Idea de Voz ${new Date().toLocaleTimeString().slice(0,5)}`
            });

        if (dbError) throw dbError;

        logToConsole(`✅ Guardado en Proyecto ID: ${selectedProjectId}`);
        setUploadStatus('done');

    } catch (err: any) {
        alert("Error guardando: " + err.message);
        setUploadStatus('idle');
    }
  };

  const handleShare = async () => {
    const textToShare = `🎵 IDEA:\n${transcription}\n\nBPM: ${musicStats?.bpm || '-'}`;
    if ((navigator as any).share) {
      await (navigator as any).share({ title: 'Studio Idea', text: textToShare });
    } else {
      navigator.clipboard.writeText(textToShare);
      alert("Copiado!");
    }
  };

  // 3. FUNCIÓN DE NAVEGACIÓN INTELIGENTE
  const goToProject = () => {
    if (selectedProjectId) {
        // Si hay proyecto seleccionado, vamos a ese específico
        router.push(`/projects/${selectedProjectId}`);
    } else {
        // Si no, vamos a la lista general
        router.push('/projects');
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/50">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-3 h-3 rounded-full shrink-0 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <div className="flex flex-col w-full">
                <h2 className="text-white font-bold tracking-tight">Witness AI</h2>
                
                {/* SELECTOR + BOTÓN DE SALTO RÁPIDO */}
                <div className="flex items-center gap-2 mt-1">
                    <FolderOpen size={12} className="text-zinc-500" />
                    <select 
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-transparent text-zinc-400 text-xs border-none outline-none cursor-pointer hover:text-emerald-400 transition-colors w-32 truncate"
                    >
                        <option value="" disabled>Seleccionar Proyecto...</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-300">
                                {p.name}
                            </option>
                        ))}
                    </select>

                    {/* 🚀 BOTÓN NUEVO: IR AL PROYECTO */}
                    <button 
                        onClick={goToProject}
                        className="p-1.5 bg-zinc-800/50 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 rounded-full transition-all border border-zinc-700/50 hover:border-emerald-500/30"
                        title="Ir a este proyecto"
                    >
                        <ExternalLink size={12} />
                    </button>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {status === 'ready' && audioBlob && (
                <button 
                    onClick={handleUpload}
                    disabled={uploadStatus !== 'idle'}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        uploadStatus === 'done' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
                >
                    {uploadStatus === 'uploading' && <Wifi className="animate-pulse w-3 h-3" />}
                    {uploadStatus === 'done' && <Check className="w-3 h-3" />}
                    {uploadStatus === 'idle' && <CloudUpload className="w-4 h-4" />}
                    {uploadStatus === 'idle' ? 'Guardar en Proyecto' : uploadStatus === 'done' ? '¡Guardado!' : 'Subiendo...'}
                </button>
            )}

            <Button 
                onClick={status === 'recording' ? stopRecording : startRecording}
                disabled={status === 'processing'}
                className={status === 'recording' ? 'bg-red-500 hover:bg-red-600 w-12 h-12 rounded-full p-0' : 'bg-white text-black hover:bg-zinc-200 w-12 h-12 rounded-full p-0'}
            >
                {status === 'recording' ? <StopCircle className="h-5 w-5"/> : <Mic className="h-5 w-5"/>}
            </Button>
          </div>
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