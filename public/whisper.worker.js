import { pipeline, env } from '@xenova/transformers';

// Configuración para velocidad y caché
env.allowLocalModels = false;
env.useBrowserCache = true; 

let transcriber = null;

self.addEventListener('message', async (event) => {
    const message = event.data;

    // A. CARGAR MODELO (Solo ocurre la primera vez)
    if (message.type === 'load') {
        try {
            self.postMessage({ status: 'loading', data: 'Descargando IA...' });
            
            // 'whisper-tiny' es rápido y ligero (~40MB)
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny'); 
            
            self.postMessage({ status: 'ready', data: 'IA Lista' });
        } catch (err) {
            self.postMessage({ status: 'error', data: err.message });
        }
    }

    // B. TRANSCRIBIR AUDIO
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