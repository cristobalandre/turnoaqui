// Usamos la versión CDN para que funcione directo en el navegador
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

// Configuración
env.allowLocalModels = false;
env.useBrowserCache = true; 

let transcriber = null;

self.addEventListener('message', async (event) => {
    const message = event.data;

    // A. CARGAR MODELO
    if (message.type === 'load') {
        try {
            self.postMessage({ status: 'loading', data: 'Cargando IA...' });
            
            // Usamos 'whisper-tiny' (versión quantized para web)
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                device: 'webgpu', // Intenta usar gráfica si puede
            });
            
            self.postMessage({ status: 'ready', data: 'IA Lista' });
        } catch (err) {
            // Si falla WebGPU, reintentamos con CPU (wasm)
             try {
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
                self.postMessage({ status: 'ready', data: 'IA Lista (Modo CPU)' });
            } catch (retryErr) {
                self.postMessage({ status: 'error', data: retryErr.message });
            }
        }
    }

    // B. TRANSCRIBIR
    if (message.type === 'transcribe') {
        if (!transcriber) return;
        try {
            const output = await transcriber(message.audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'spanish', 
                task: 'transcribe',
            });
            self.postMessage({ status: 'complete', text: output.text });
        } catch (err) {
            self.postMessage({ status: 'error', data: err.message });
        }
    }
});