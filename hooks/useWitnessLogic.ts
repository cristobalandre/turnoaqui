// hooks/useWitnessLogic.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logToConsole } from '@/utils/remoteLogger'

const supabase = createClient();

export const useWitnessLogic = () => {
  const router = useRouter();
  
  // --- ESTADOS ---
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  // Gestión de Proyectos
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Nuevo Proyecto & Metadatos
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  const [ideaName, setIdeaName] = useState('');
  
  const [credits, setCredits] = useState({
      client: '',
      producer: '',
      songwriter: '',
      engineer: ''
  });

  // --- REFS (Mecánica Interna) ---
  const musicWorkerRef = useRef<Worker | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  // AudioContext SOLO para decodificar (no para grabar en vivo)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // --- EFECTOS ---
  useEffect(() => {
    fetchProjects();

    // Inicializar Worker
    if (!musicWorkerRef.current) {
        musicWorkerRef.current = new Worker('/music.worker.js');
        musicWorkerRef.current.onmessage = (event) => {
            const { type, bpm, key, message } = event.data;
            if (type === 'result') setMusicStats({ bpm, key });
            if (type === 'error') logToConsole("⚠️ Música:", message);
            if (type === 'ready') logToConsole("✅ Motor Musical Listo");
        };
        musicWorkerRef.current.postMessage({ type: 'init' });
    }

    return () => {
        musicWorkerRef.current?.terminate();
        stopRecording(); // Limpieza al salir
    };
  }, [])

  // --- FUNCIONES ---
  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if(!session) return;

    const { data } = await supabase
        .from('projects')
        .select('id, title')
        .order('created_at', { ascending: false });
    
    if (data) {
        const formattedProjects = data.map((p: any) => ({
            id: p.id,
            name: p.title || 'Sin Título' 
        }));
        setProjects(formattedProjects);
        if (formattedProjects.length > 0 && !selectedProjectId && !isCreatingNew) {
            setSelectedProjectId(formattedProjects[0].id);
        }
    }
  };

  const startRecording = async () => {
    setErrorMessage('');
    setMusicStats(null);
    setAudioBlob(null);
    setUploadStatus('idle');
    setIdeaName('');
    chunksRef.current = [];

    // 1. Preparamos el Motor de Audio (aunque no lo usemos todavía)
    // Esto es vital en iOS: crearlo tras el clic del usuario
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass({ 
        sampleRate: 16000, // Forzamos 16k para Essentia
        latencyHint: 'playback' 
    });
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    audioContextRef.current = audioContext;

    try {
        // 2. Pedimos micrófono (Sin filtros para mejor calidad musical)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        streamRef.current = stream;

        // 3. Iniciamos Grabadora
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'; 
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start(1000); 
        setStatus('recording');

    } catch (err: any) {
        alert("Error Micrófono: " + err.message);
    }
  }

  const stopRecording = async () => {
    if (status !== 'recording') return;
    
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());

    setStatus('processing');

    // Esperamos a que se genere el archivo final
    setTimeout(async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        setIdeaName(`Idea ${new Date().toLocaleTimeString().slice(0,5)}`);

        // --- A. ANÁLISIS MUSICAL (ESTRATEGIA POST-GRABACIÓN) ---
        // Decodificamos el archivo real, asegurando que analizamos lo mismo que se grabó
        try {
            if (audioContextRef.current) {
                // 1. Blob -> ArrayBuffer
                const arrayBuffer = await finalBlob.arrayBuffer();
                // 2. ArrayBuffer -> AudioBuffer (Decodificación nativa)
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                // 3. Extraemos los datos crudos (PCM)
                const pcmData = audioBuffer.getChannelData(0);
                
                // 4. Enviamos al Worker
                console.log("Enviando audio a analizar:", pcmData.length, "muestras");
                musicWorkerRef.current?.postMessage({ type: 'analyze', audio: pcmData });
            }
        } catch (e) {
            console.warn("Error en análisis post-grabación:", e);
        }

        // --- B. TRANSCRIPCIÓN ---
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

        setStatus('ready');
    }, 500);
  }

  const handleUpload = async () => {
    if (!audioBlob) return;
    
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

        if (isCreatingNew) {
            const formatList = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

            const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert({
                    title: newProjectName,
                    user_id: session.user.id,
                    status: 'active',
                    client: credits.client,
                    credits: {
                        producer: formatList(credits.producer), 
                        songwriter: formatList(credits.songwriter),
                        engineer: formatList(credits.engineer)
                    }
                })
                .select()
                .single();

            if (createError) throw createError;
            
            targetProjectId = newProject.id;
            const newProjFormatted = { id: newProject.id, name: newProject.title };
            setProjects([newProjFormatted, ...projects]);
            setSelectedProjectId(newProject.id);
            setIsCreatingNew(false);
            setNewProjectName("");
            setCredits({ client: '', producer: '', songwriter: '', engineer: '' });
        }

        const isMp4 = audioBlob.type.includes('mp4');
        const ext = isMp4 ? 'm4a' : 'webm';
        const fileName = `${targetProjectId}/${Date.now()}_demo.${ext}`;
        
        const { error: uploadError } = await supabase.storage
            .from('demos')
            .upload(fileName, audioBlob, { contentType: audioBlob.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('demos').getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('project_ideas')
            .insert({
                project_id: targetProjectId,
                file_url: publicUrl,
                transcription: transcription,
                bpm: musicStats?.bpm || 0,
                music_key: musicStats?.key || '',
                name: ideaName || `Idea Sin Nombre`
            });

        if (dbError) throw dbError;

        logToConsole(`✅ Guardado profesional en ID: ${targetProjectId}`);
        setUploadStatus('done');

    } catch (err: any) {
        alert("Error: " + err.message);
        setUploadStatus('idle');
    }
  };

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

  return {
    status, transcription, musicStats, errorMessage, audioBlob, uploadStatus,
    projects, selectedProjectId, isCreatingNew, newProjectName, showCredits, 
    credits, ideaName,
    setTranscription, setSelectedProjectId, setIsCreatingNew, setNewProjectName,
    setShowCredits, setCredits, setIdeaName,
    startRecording, stopRecording, handleUpload, handleProjectSelect
  };
}