// Importamos Essentia desde CDN (Versión ES Module)
import { EssentiaWASM } from 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.es.js';

let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    // 1. Inicializar (Cargar el cerebro)
    if (type === 'init') {
        try {
            // Inicializamos Essentia (false = no usar worklet interno, usamos este worker)
            essentia = new EssentiaWASM(false);
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error cargando Essentia: ' + err.message });
        }
    }

    // 2. Analizar Audio
    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Essentia no está listo' });
            return;
        }

        try {
            // Convertir el audio (Float32Array) al formato vectorial de Essentia
            const vectorAudio = essentia.arrayToVector(audio);

            // A. Detectar BPM (Ritmo)
            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            const bpm = Math.round(bpmAlgo.bpm);

            // B. Detectar Tonalidad (Key)
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');
            const key = `${keyAlgo.key} ${keyAlgo.scale}`;

            // Liberar memoria (Importante en móviles)
            // vectorAudio.delete(); // (Opcional, depende de la versión)

            self.postMessage({ type: 'result', bpm, key });

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Fallo en análisis: ' + err.message });
        }
    }
});