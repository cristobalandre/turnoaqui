// ✅ MÉTODO A PRUEBA DE BALAS PARA IPHONE
// Usamos importScripts (el estándar antiguo) en lugar de 'import' moderno.
importScripts('https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js');

// La librería se carga en el objeto global 'self'
const EssentiaWASM = self.EssentiaWASM;
let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'init') {
        try {
            // false = Usar este worker, no crear otro interno
            essentia = new EssentiaWASM(false);
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Init Música: ' + err.message });
        }
    }

    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Motor musical no listo' });
            return;
        }

        try {
            // Convertir datos de audio
            const vectorAudio = essentia.arrayToVector(audio);

            // 1. Detectar BPM
            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            
            // 2. Detectar Key
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');

            self.postMessage({ 
                type: 'result', 
                bpm: Math.round(bpmAlgo.bpm), 
                key: `${keyAlgo.key} ${keyAlgo.scale}` 
            });

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Fallo Análisis: ' + err.message });
        }
    }
});