// ✅ MODO LOCAL LIMPIO
// 1. Cargamos la librería (esto crea 'EssentiaWASM' automáticamente)
// Usamos un chequeo por seguridad por si se carga dos veces.
if (typeof EssentiaWASM === 'undefined') {
    importScripts('/essentia-wasm.web.js');
}

// ❌ BORRADO: const EssentiaWASM = self.EssentiaWASM; 
// (Ya no re-declaramos la variable, usamos la global directo)

let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'init') {
        try {
            // Usamos EssentiaWASM directamente (ya existe gracias al import)
            essentia = new EssentiaWASM(false);
            
            essentia.module.onRuntimeInitialized = () => {
                self.postMessage({ type: 'ready' });
            };
            
            // Fallback por si carga muy rápido
            if (essentia.module.calledRun) {
                 self.postMessage({ type: 'ready' });
            }

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Init: ' + err.message });
        }
    }

    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Motor no iniciado' });
            return;
        }

        try {
            const vectorAudio = essentia.arrayToVector(audio);

            // Algoritmos
            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');

            self.postMessage({ 
                type: 'result', 
                bpm: Math.round(bpmAlgo.bpm), 
                key: `${keyAlgo.key} ${keyAlgo.scale}` 
            });

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Análisis: ' + err.message });
        }
    }
});