"use client";

import React from 'react';

interface ClientModalProps {
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  onCreate: () => void;
}

export const ClientModal = ({
  onClose,
  name,
  setName,
  phone,
  setPhone,
  onCreate
}: ClientModalProps) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[48px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Efecto de luz decorativo */}
        <div className="absolute top-0 right-10 w-20 h-20 bg-emerald-500/10 blur-3xl rounded-full" />
        
        <h3 className="text-white text-2xl font-light mb-8 tracking-tighter">
          Nuevo <span className="text-emerald-500">Perfil de Artista</span>
        </h3>
        
        <div className="flex flex-col gap-5">
          <input 
            placeholder="Nombre Artístico" 
            className="bg-zinc-800/50 border border-zinc-700/50 p-5 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-600" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
          <input 
            placeholder="WhatsApp / Contacto" 
            className="bg-zinc-800/50 border border-zinc-700/50 p-5 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-600" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />
          
          <button 
            onClick={onCreate} 
            className="bg-white text-black p-6 rounded-3xl font-black tracking-[0.2em] mt-4 hover:bg-emerald-400 transition-all uppercase shadow-xl active:scale-95"
          >
            Registrar Artista
          </button>
          
          <button 
            onClick={onClose}
            className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};