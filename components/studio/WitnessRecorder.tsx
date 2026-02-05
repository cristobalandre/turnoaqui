'use client'

import React from 'react'
import { Mic, StopCircle, Music, Type, Wifi, Check, CloudUpload, FolderOpen, X, User, Disc, Headphones, PenTool, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react'
import { useWitnessLogic } from '@/hooks/useWitnessLogic'

export default function WitnessRecorder() {
  const {
    status, transcription, musicStats, errorMessage, audioBlob, uploadStatus,
    projects, selectedProjectId, isCreatingNew, newProjectName, showCredits, 
    credits, ideaName,
    setTranscription, setNewProjectName, setShowCredits, setCredits, setIdeaName,
    startRecording, stopRecording, handleUpload, handleProjectSelect, setIsCreatingNew
  } = useWitnessLogic();

  // --- COMPONENTES UI INTERNOS PARA ESTILO 3D ---

  // Botón Metálico 3D con Aura
  const MetallicButton = ({ onClick, disabled, active, icon: Icon, color = "zinc" }: any) => {
    const isRed = color === "red";
    const baseGradient = isRed 
        ? "from-red-900 via-red-600 to-red-800" 
        : "from-zinc-700 via-zinc-600 to-zinc-800";
    const activeGlow = active ? "shadow-[0_0_20px_rgba(239,68,68,0.6)]" : "shadow-lg";

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative flex items-center justify-center w-14 h-14 rounded-full 
                bg-gradient-to-b ${baseGradient}
                border-t border-white/20 border-b border-black/50
                ${activeGlow} transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            `}
        >
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />
            <Icon className={`w-6 h-6 text-white drop-shadow-md ${active ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`} />
        </button>
    );
  };

  // Input Minimalista Geminizado
  const GeminiInput = ({ icon: Icon, label, ...props }: any) => (
      <div className="relative group space-y-1">
          {label && <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1 font-bold tracking-wider ml-1"><Icon size={10}/> {label}</label>}
          <div className="relative">
             {!label && <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors"><Icon size={12} /></div>}
             <input 
                  {...props}
                  className={`w-full bg-zinc-900/40 border border-white/5 rounded-xl ${label ? "px-3" : "pl-9 pr-3"} py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900/80 transition-all font-medium tracking-wide shadow-inner`}
              />
          </div>
      </div>
  );

  return (
    <div className="relative w-full max-w-3xl mx-auto group my-8">
        
        {/* 🔥 AURA SUAVE DE FONDO */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000 animate-pulse-slow pointer-events-none" />

        {/* CONTENEDOR PRINCIPAL CRISTAL */}
        <div className="relative bg-[#09090b] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-3xl">
            
            {/* --- HEADER --- */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    {/* IZQUIERDA: Logo & Selector */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${status === 'recording' ? 'text-red-500 bg-red-500 animate-ping' : 'text-emerald-500 bg-emerald-500'}`} />
                            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold tracking-tight text-lg flex items-center gap-2">
                                <Sparkles size={14} className="text-indigo-400" /> Witness AI
                            </h2>
                        </div>

                        {/* Selector Píldora */}
                        <div className="flex items-center bg-black/40 rounded-full border border-white/5 p-1 pl-3 pr-1 backdrop-blur-sm shadow-inner transition-colors hover:border-white/10">
                            <FolderOpen size={12} className="text-zinc-500 mr-2" />
                            
                            {isCreatingNew ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                    <input 
                                        type="text" autoFocus placeholder="Nombre Proyecto..."
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="bg-transparent text-white text-xs outline-none w-32 placeholder-zinc-600 focus:placeholder-zinc-400"
                                    />
                                    <button onClick={() => setIsCreatingNew(false)} className="bg-zinc-800 p-1 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <select 
                                    value={selectedProjectId}
                                    onChange={handleProjectSelect}
                                    className="bg-transparent text-zinc-300 text-xs border-none outline-none cursor-pointer hover:text-white transition-colors w-40 truncate appearance-none font-medium"
                                >
                                    <option value="__NEW__" className="bg-zinc-900 text-indigo-400 font-bold">+ Crear Nuevo...</option>
                                    <option disabled className="bg-zinc-900">────────────────</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-300">{p.name}</option>
                                    ))}
                                </select>
                            )}
                            
                            {!isCreatingNew && (
                                <ChevronDown size={12} className="text-zinc-600 ml-1 pointer-events-none" />
                            )}
                        </div>
                    </div>

                    {/* DERECHA: Controles 3D */}
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'recording' ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                                {status === 'recording' ? 'GRABANDO EN VIVO' : status === 'processing' ? 'PROCESANDO IA...' : 'MODO ESPERA'}
                            </span>
                        </div>
                        <MetallicButton 
                            onClick={status === 'recording' ? stopRecording : startRecording}
                            disabled={status === 'processing'}
                            active={status === 'recording'}
                            icon={status === 'recording' ? StopCircle : Mic}
                            color={status === 'recording' ? 'red' : 'zinc'}
                        />
                    </div>
                </div>

                {/* --- SECCIÓN CRÉDITOS DESPLEGABLE (LÓGICA MANTENIDA) --- */}
                {isCreatingNew && (
                    <div className="mt-6 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 fade-in">
                        <button 
                            onClick={() => setShowCredits(!showCredits)}
                            className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400 hover:text-indigo-400 mb-4 transition-colors uppercase"
                        >
                            {showCredits ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            {showCredits ? "Ocultar Metadatos" : "Configuración Avanzada del Proyecto"}
                        </button>

                        {showCredits && (
                            <div className="grid grid-cols-2 gap-4">
                                <GeminiInput label="Cliente" icon={User} placeholder="Ej: Stars Music" value={credits.client} onChange={(e: any) => setCredits({...credits, client: e.target.value})} />
                                <GeminiInput label="Productor(es)" icon={Disc} placeholder="Ej: Bizarrap, Fred Again..." value={credits.producer} onChange={(e: any) => setCredits({...credits, producer: e.target.value})} />
                                <GeminiInput label="Compositor(es)" icon={PenTool} placeholder="Ej: Bad bunny, Deftones" value={credits.songwriter} onChange={(e: any) => setCredits({...credits, songwriter: e.target.value})} />
                                <GeminiInput label="Ingeniero(s)" icon={Headphones} placeholder="Ej: MixMaster" value={credits.engineer} onChange={(e: any) => setCredits({...credits, engineer: e.target.value})} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- MENSAJES DE ERROR --- */}
            {errorMessage && (
                <div className="bg-red-500/10 border-b border-red-500/10 p-2 text-center text-red-400 text-xs font-medium flex items-center justify-center gap-2 backdrop-blur-md animate-in slide-in-from-top-1">
                    <AlertTriangle size={12} /> {errorMessage}
                </div>
            )}

            {/* --- BARRA DE GUARDADO (Aparece al terminar) --- */}
            {status === 'ready' && audioBlob && (
                <div className="px-6 py-4 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Nueva Toma:</span>
                    <input 
                        value={ideaName}
                        onChange={(e) => setIdeaName(e.target.value)}
                        className="bg-transparent border-b border-indigo-500/30 text-sm text-white focus:border-indigo-400 outline-none flex-1 pb-1 font-medium placeholder-zinc-600 transition-colors"
                        placeholder="Nombra esta idea..."
                    />
                    
                    <button 
                        onClick={handleUpload}
                        disabled={uploadStatus !== 'idle'}
                        className={`
                            px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg
                            ${uploadStatus === 'done' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                                : 'bg-white text-black hover:scale-105 hover:shadow-white/20 hover:bg-zinc-100'}
                        `}
                    >
                        {uploadStatus === 'uploading' && <Wifi className="animate-pulse w-3 h-3" />}
                        {uploadStatus === 'done' && <Check className="w-3 h-3" />}
                        {uploadStatus === 'idle' && <CloudUpload className="w-3 h-3" />}
                        {uploadStatus === 'idle' ? 'Guardar' : uploadStatus === 'done' ? 'Guardado' : 'Subiendo...'}
                    </button>
                </div>
            )}

            {/* --- BODY: DATOS Y TEXTO --- */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 bg-black/20">
                
                {/* IZQUIERDA: VISUALIZADOR MUSICAL */}
                <div className="p-6 flex flex-col justify-center min-h-[200px]">
                    <div className="flex items-center gap-2 text-zinc-500 mb-6">
                        <Music className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live Analysis</span>
                    </div>
                    
                    {musicStats ? (
                        <div className="flex gap-4 animate-in zoom-in-95 duration-500">
                            {/* BPM CARD */}
                            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 flex-1 text-center group transition-all hover:border-white/20">
                                <div className="absolute top-0 right-0 w-10 h-10 bg-white/5 rounded-bl-full -mr-2 -mt-2 transition-all group-hover:bg-white/10" />
                                <span className="text-zinc-500 text-[10px] font-bold uppercase block mb-1 tracking-wider">BPM</span>
                                <div className="text-4xl font-black text-white tracking-tighter drop-shadow-glow">{musicStats.bpm}</div>
                            </div>
                            
                            {/* KEY CARD */}
                            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 flex-1 text-center group transition-all hover:border-emerald-500/30">
                                <div className="absolute top-0 right-0 w-10 h-10 bg-emerald-500/10 rounded-bl-full -mr-2 -mt-2 transition-all group-hover:bg-emerald-500/20" />
                                <span className="text-zinc-500 text-[10px] font-bold uppercase block mb-1 tracking-wider">KEY</span>
                                <div className="text-4xl font-black text-emerald-400 tracking-tighter drop-shadow-glow">{musicStats.key}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-3 opacity-50">
                            <div className="flex gap-1 items-end h-8">
                                <div className="w-1 bg-zinc-700 h-3 animate-pulse" />
                                <div className="w-1 bg-zinc-700 h-6 animate-pulse delay-75" />
                                <div className="w-1 bg-zinc-700 h-4 animate-pulse delay-150" />
                                <div className="w-1 bg-zinc-700 h-7 animate-pulse delay-100" />
                                <div className="w-1 bg-zinc-700 h-3 animate-pulse" />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-medium">Esperando Audio</span>
                        </div>
                    )}
                </div>

                {/* DERECHA: TRANSCRIPCIÓN */}
                <div className="p-6 flex flex-col h-full bg-gradient-to-br from-transparent to-white/[0.02]">
                    <div className="flex items-center gap-2 text-zinc-500 mb-4">
                        <Type className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Transcripción IA</span>
                    </div>
                    
                    <textarea 
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        className="flex-1 w-full bg-transparent border-none text-zinc-300 text-sm font-medium leading-relaxed focus:outline-none resize-none placeholder-zinc-700 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        placeholder="Inicia la grabación para ver la letra aparecer en tiempo real..."
                        style={{ fontFamily: 'var(--font-geist-mono), monospace' }} 
                    />
                </div>
            </div>
        </div>
    </div>
  )
}