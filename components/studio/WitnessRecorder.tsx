'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, StopCircle, Music, Type, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { analyzeAudio } from '@/utils/audioAnalyzer'

export default function WitnessRecorder() {
  const [status, setStatus] = useState('idle') 
  const [transcription, setTranscription] = useState('')
  const [musicStats, setMusicStats] = useState<{ bpm: number; key: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  const workerRef = useRef<Worker | null>(null)
  // Reemplazamos MediaRecorder por referencias de AudioContext
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioChunksRef = useRef<Float32Array[]>([])

  useEffect(() => {
    // 1. Iniciamos el Worker (Igual que antes)
    if (!workerRef.current) {
      workerRef.current = new Worker('/whisper.worker.js', { type: 'module' });
      
      workerRef.current.onmessage = (event) => {
        const { status, text, data } = event.data;
        if (status === 'loading') setStatus('loading');
        if (status === 'ready') setStatus('ready');
        if (status === 'complete') {
            const cleanText = text.replace(/\(música\)|\(music\)/gi, "").trim();
            if (cleanText) setTranscription(prev => prev + " " + cleanText);
            setStatus('ready');
        }
        if (status === 'error') {
            setErrorMessage("Error IA: " + data);
            setStatus('ready');
        }
      };

      workerRef.current.postMessage({ type: 'load' });
    }

    return () => {
        workerRef.current?.terminate();
        stopRecording(); // Limpieza de seguridad
    };
  }, [])

  const startRecording = async () => {
    setErrorMessage('');
    setTranscription('');
    setMusicStats(null);
    audioChunksRef.current = []; // Limpiamos buffer

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // 🦁 TRUCO UNIVERSAL: AudioContext
        // Safari necesita webkitAudioContext antiguo a veces, pero los nuevos usan AudioContext estándar
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate: 16000 }); // Whisper ama 16khz
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // "ScriptProcessor" es antiguo pero es el más compatible universalmente para capturar RAW
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            // Capturamos los datos crudos (float32)
            const inputData = e.inputBuffer.getChannelData(0);
            // Hacemos una copia profunda de los datos
            audioChunksRef.current.push(new Float32Array(inputData));
        };

        source.connect(processor);
        processor.connect(audioContext.destination); // Necesario para que el proceso corra

        setStatus('recording');
    } catch (err: any) {
        alert("Error Micrófono: " + err.message);
    }
  }

  const stopRecording = async () => {
    if (status !== 'recording') return;

    // 1. Detener todo
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();

    setStatus('processing');

    // 2. Unir todos los trozos de audio (Flatten)
    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const fullAudioBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
        fullAudioBuffer.set(chunk, offset);
        offset += chunk.length;
    }

    // Si el audio es muy corto o silencio absoluto
    if (fullAudioBuffer.length === 0) {
        setErrorMessage("No se grabó audio.");
        setStatus('ready');
        return;
    }

    try {
        // --- ENVÍO A LA IA (WHISPER) ---
        // Whisper acepta Float32Array directo, ¡no necesitamos convertir a archivo!
        workerRef.current?.postMessage({ 
            type: 'transcribe', 
            audio: fullAudioBuffer 
        });

        // --- ENVÍO A MÚSICA (ESSENTIA) ---
        // Necesitamos recrear un AudioBuffer falso para Essentia
        // (Ya que Essentia.js espera un AudioBuffer del navegador)
        const offlineCtx = new OfflineAudioContext(1, fullAudioBuffer.length, 16000);
        const audioBuffer = offlineCtx.createBuffer(1, fullAudioBuffer.length, 16000);
        audioBuffer.copyToChannel(fullAudioBuffer, 0);

        const stats = await analyzeAudio(audioBuffer);
        setMusicStats(stats);

    } catch (err) {
        console.error(err);
        setErrorMessage("Error procesando audio.");
    }
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
                    {status === 'recording' && "GRABANDO RAW..."}
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

      {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-red-400 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-3 h-3" /> {errorMessage}
          </div>
      )}

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