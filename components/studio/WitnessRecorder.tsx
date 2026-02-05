'use client'

import React, { useState, useEffect, useRef } from 'react'
// Agregamos 'Plus' y 'X' para la interfaz de nuevo proyecto
import { Mic, StopCircle, Music, Type, Zap, AlertTriangle, Wifi, Share, Copy, CloudUpload, Check, FolderOpen, ExternalLink, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logToConsole } from '@/utils/remoteLogger'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient();

export default function WitnessRecorder() {
  const router = useRouter();
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  // 🆕 ESTADOS PARA NUEVO PROYECTO
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false); // ¿Estamos creando uno nuevo?
  const [newProjectName, setNewProjectName] = useState('');  // Nombre del nuevo proyecto

  const musicWorkerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rawAudioBufferRef = useRef<Float32Array[]>([])

  useEffect(() => {
    fetchProjects();

    // WORKER MUSICAL
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

  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if(!session) return;

    const { data } = await supabase
        .from('projects')
        .select('id, title') // Usamos 'title' como corregimos antes
        .order('created_at', { ascending: false });
    
    if (data) {
        const formattedProjects = data.map((p: any) => ({
            id: p.id,
            name: p.title || 'Sin Título' 
        }));
        setProjects(formattedProjects);
        // Seleccionar el primero por defecto si existe
        if (formattedProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(formattedProjects[0].id);
        }
    }
  };

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
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'; 
        
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

    } catch (err: any) {
        alert("Error: " + err.message);
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
        
        // Transcribir (Groq)
        const formData = new FormData();
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        formData.append('file', finalBlob, `audio.${ext}`);

        try {
            const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.text) setTranscription(prev => (prev ? prev + " " : "") + data.text);
        } catch (e: any) {
            logToConsole("Error Transcripción:", e.message);
        }

        // Analizar Música
        const totalLength = rawAudioBufferRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const fullRawBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of rawAudioBufferRef.current) {
            fullRawBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        musicWorkerRef.current?.postMessage({ type: 'analyze', audio: fullRawBuffer });

        setStatus('ready');
    }, 500);
  }

  // 🚀 LÓGICA MAESTRA DE GUARDADO
  const handleUpload = async () => {
    if (!audioBlob) return;
    
    // Validación de Nuevo Proyecto
    if (isCreatingNew && !newProjectName.trim()) {
        alert("⚠️ Escribe un nombre para el nuevo proyecto.");
        return;
    }
    if (!isCreatingNew && !selectedProjectId) {
        alert("⚠️ Selecciona un proyecto.");
        return;
    }

    setUploadStatus('uploading');

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No sesión");

        let targetProjectId = selectedProjectId;

        // 1. SI ES NUEVO PROYECTO: CREARLO PRIMERO
        if (isCreatingNew) {
            const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert({
                    title: newProjectName, // Usamos 'title'
                    user_id: session.user.id,
                    status: 'active'
                })
                .select()
                .single();

            if (createError) throw createError;
            
            targetProjectId = newProject.id;
            
            // Actualizamos la lista localmente para que se vea reflejado
            const newProjFormatted = { id: newProject.id, name: newProject.title };
            setProjects([newProjFormatted, ...projects]);
            setSelectedProjectId(newProject.id);
            setIsCreatingNew(false); // Salimos del modo creación
            setNewProjectName("");
        }

        // 2. SUBIR AUDIO
        const isMp4 = audioBlob.type.includes('mp4');
        const ext = isMp4 ? 'm4a' : 'webm';
        const fileName = `${targetProjectId}/${Date.now()}_demo.${ext}`;
        
        const { error: uploadError } = await supabase.storage
            .from('demos')
            .upload(fileName, audioBlob, { contentType: audioBlob.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('demos').getPublicUrl(fileName);

        // 3. GUARDAR LA IDEA (LINK)
        const { error: dbError } = await supabase
            .from('project_ideas')
            .insert({
                project_id: targetProjectId,
                file_url: publicUrl,
                transcription: transcription,
                bpm: musicStats?.bpm || 0,
                music_key: musicStats?.key || '',
                name: `Idea ${new Date().toLocaleTimeString().slice(0,5)}`
            });

        if (dbError) throw dbError;

        logToConsole(`✅ Guardado en Proyecto: ${targetProjectId}`);
        setUploadStatus('done');

    } catch (err: any) {
        alert("Error: " + err.message);
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

  const goToProject = () => {
    if (selectedProjectId && !isCreatingNew) {
        router.push(`/projects/${selectedProjectId}`);
    } else {
        router.push('/projects');
    }
  }

  // Manejador del Selector
  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === '__NEW__') {
          setIsCreatingNew(true);
          setSelectedProjectId('');
      } else {
          setIsCreatingNew(false);
          setSelectedProjectId(val);
      }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* HEADER */}
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/50">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-3 h-3 rounded-full shrink-0 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <div className="flex flex-col w-full">
                <h2 className="text-white font-bold tracking-tight">Witness AI</h2>
                
                {/* 🔽 ZONA DE SELECCIÓN INTELIGENTE 🔽 */}
                <div className="flex items-center gap-2 mt-1">
                    <FolderOpen size={12} className="text-zinc-500" />
                    
                    {isCreatingNew ? (
                        // INPUT PARA NUEVO PROYECTO
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Nombre del nuevo proyecto..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-zinc-700 outline-none w-40 focus:border-emerald-500"
                            />
                            <button onClick={() => setIsCreatingNew(false)} className="text-zinc-500 hover:text-red-400">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        // SELECTOR NORMAL
                        <select 
                            value={selectedProjectId}
                            onChange={handleProjectSelect}
                            className="bg-transparent text-zinc-400 text-xs border-none outline-none cursor-pointer hover:text-emerald-400 transition-colors w-40 truncate"
                        >
                            {/* OPCIÓN MÁGICA */}
                            <option value="__NEW__" className="bg-zinc-800 text-emerald-400 font-bold">
                                + Crear Nuevo Proyecto...
                            </option>
                            <option disabled className="bg-zinc-900">----------------</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-300">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {!isCreatingNew && (
                        <button 
                            onClick={goToProject}
                            className="p-1.5 bg-zinc-800/50 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 rounded-full transition-all border border-zinc-700/50 hover:border-emerald-500/30"
                            title="Ir a este proyecto"
                        >
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* BOTÓN DE GUARDADO */}
             {status === 'ready' && audioBlob && (
                <button 
                    onClick={handleUpload}
                    disabled={uploadStatus !== 'idle'}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        uploadStatus === 'done' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : isCreatingNew ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
                >
                    {uploadStatus === 'uploading' && <Wifi className="animate-pulse w-3 h-3" />}
                    {uploadStatus === 'done' && <Check className="w-3 h-3" />}
                    {uploadStatus === 'idle' && (isCreatingNew ? <Plus className="w-4 h-4" /> : <CloudUpload className="w-4 h-4" />)}
                    
                    {/* TEXTO DINÁMICO */}
                    {uploadStatus === 'idle' 
                        ? (isCreatingNew ? 'Crear y Guardar' : 'Guardar en Proyecto') 
                        : uploadStatus === 'done' ? '¡Listo!' : 'Procesando...'}
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

      {/* BODY (Igual) */}
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