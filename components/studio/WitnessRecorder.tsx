'use client'

import React from 'react'
import { Mic, StopCircle, Music, Type, Zap, AlertTriangle, Wifi, Check, CloudUpload, FolderOpen, Plus, X, User, Disc, Headphones, PenTool, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWitnessLogic } from '@/hooks/useWitnessLogic' // 👈 Importamos tu nuevo cerebro

export default function WitnessRecorder() {
  // Extraemos todo del hook y el componente solo se encarga de mostrar cosas
  const {
    status, transcription, musicStats, errorMessage, audioBlob, uploadStatus,
    projects, selectedProjectId, isCreatingNew, newProjectName, showCredits, 
    credits, ideaName,
    setTranscription, setNewProjectName, setShowCredits, setCredits, setIdeaName,
    startRecording, stopRecording, handleUpload, handleProjectSelect, setIsCreatingNew
  } = useWitnessLogic();

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* HEADER */}
      <div className="p-6 border-b border-zinc-800 flex flex-col justify-between gap-4 bg-zinc-900/50">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className={`w-3 h-3 rounded-full shrink-0 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div className="flex flex-col w-full">
                    <h2 className="text-white font-bold tracking-tight">Witness AI</h2>
                    
                    {/* SELECTOR */}
                    <div className="flex items-center gap-2 mt-1">
                        <FolderOpen size={12} className="text-zinc-500" />
                        
                        {isCreatingNew ? (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                <input 
                                    type="text" autoFocus placeholder="Nombre Proyecto..."
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-zinc-700 outline-none w-32 focus:border-emerald-500"
                                />
                                <button onClick={() => setIsCreatingNew(false)} className="text-zinc-500 hover:text-red-400">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <select 
                                value={selectedProjectId}
                                onChange={handleProjectSelect}
                                className="bg-transparent text-zinc-400 text-xs border-none outline-none cursor-pointer hover:text-emerald-400 transition-colors w-40 truncate"
                            >
                                <option value="__NEW__" className="bg-zinc-800 text-emerald-400 font-bold">+ Crear Nuevo Proyecto...</option>
                                <option disabled className="bg-zinc-900">----------------</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-300">{p.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button 
                    onClick={status === 'recording' ? stopRecording : startRecording}
                    disabled={status === 'processing'}
                    className={status === 'recording' ? 'bg-red-500 hover:bg-red-600 w-12 h-12 rounded-full p-0 shadow-lg shadow-red-900/50' : 'bg-white text-black hover:bg-zinc-200 w-12 h-12 rounded-full p-0'}
                >
                    {status === 'recording' ? <StopCircle className="h-5 w-5"/> : <Mic className="h-5 w-5"/>}
                </Button>
            </div>
          </div>

          {/* CRÉDITOS */}
          {isCreatingNew && (
              <div className="mt-2 pt-4 border-t border-zinc-800 animate-in slide-in-from-top-2">
                  <button 
                    onClick={() => setShowCredits(!showCredits)}
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-3 transition-colors"
                  >
                      {showCredits ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      {showCredits ? "Ocultar Detalles" : "Agregar Créditos (Opcional)"}
                  </button>

                  {showCredits && (
                      <div className="grid grid-cols-2 gap-3 pb-2">
                          <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><User size={10}/> Cliente</label>
                              <input 
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                                placeholder="Ej: Stars Music"
                                value={credits.client}
                                onChange={(e) => setCredits({...credits, client: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                              {/* Pluralizamos la etiqueta */}
                              <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Disc size={10}/> Productor(es)</label>
                              <input 
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                                placeholder="Ej: Bizarrap, Fred Again..." // Placeholder claro
                                value={credits.producer}
                                onChange={(e) => setCredits({...credits, producer: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><PenTool size={10}/> Compositor(es)</label>
                              <input 
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                                placeholder="Ej: Deftones, Bad bunny"
                                value={credits.songwriter}
                                onChange={(e) => setCredits({...credits, songwriter: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Headphones size={10}/> Ingeniero(s)</label>
                              <input 
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                                placeholder="Ej: MixMaster, Assistant"
                                value={credits.engineer}
                                onChange={(e) => setCredits({...credits, engineer: e.target.value})}
                              />
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>

      {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-red-400 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-3 h-3" /> {errorMessage}
          </div>
      )}

      {/* BARRA DE GUARDADO */}
      {status === 'ready' && (
          <div className="px-6 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-3 animate-in fade-in">
              <span className="text-xs text-zinc-400">Nombre toma:</span>
              <input 
                  value={ideaName}
                  onChange={(e) => setIdeaName(e.target.value)}
                  className="bg-transparent border-b border-zinc-600 text-sm text-white focus:border-emerald-500 outline-none flex-1 pb-1"
              />
              <button 
                    onClick={handleUpload}
                    disabled={uploadStatus !== 'idle'}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ml-auto ${
                        uploadStatus === 'done' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                >
                    {uploadStatus === 'uploading' && <Wifi className="animate-pulse w-3 h-3" />}
                    {uploadStatus === 'done' && <Check className="w-3 h-3" />}
                    {uploadStatus === 'idle' && <CloudUpload className="w-3 h-3" />}
                    {uploadStatus === 'idle' ? 'GUARDAR' : uploadStatus === 'done' ? 'LISTO' : 'SUBIENDO...'}
                </button>
          </div>
      )}

      {/* DATOS MUSICALES */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-4">
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Análisis Musical</span>
              </div>
              {musicStats ? (
                  <div className="flex gap-4 animate-in fade-in">
                      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex-1 text-center">
                          <span className="text-zinc-500 text-[10px] uppercase block mb-1">BPM</span>
                          <div className="text-3xl font-black text-white">{musicStats.bpm}</div>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex-1 text-center">
                          <span className="text-zinc-500 text-[10px] uppercase block mb-1">KEY</span>
                          <div className="text-3xl font-black text-emerald-400">{musicStats.key}</div>
                      </div>
                  </div>
              ) : (
                  <div className="h-24 flex items-center justify-center text-zinc-700 text-xs italic border border-dashed border-zinc-800 rounded-xl">
                      Esperando audio...
                  </div>
              )}
          </div>

          <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Type className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Transcripción</span>
              </div>
              <textarea 
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="flex-1 w-full bg-zinc-900/30 rounded-xl p-3 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none resize-none min-h-[150px]"
                  placeholder="Aquí aparecerá la letra..."
              />
          </div>
      </div>
    </div>
  )
}