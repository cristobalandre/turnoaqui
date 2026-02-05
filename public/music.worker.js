// ----------------------------------------------------------------------
// 1. EL TRUCO DE MAGIA (Polyfill) 🎩✨
// ----------------------------------------------------------------------
// Los Workers no tienen 'document'. Creamos uno falso para engañar a la librería
// y que crea que está en el navegador principal.
if (typeof self.document === 'undefined') {
    self.document = {
        currentScript: null, // Lo más importante que suele buscar
        createElement: () => ({}), // Si intenta crear algo, le damos aire
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
}

// ----------------------------------------------------------------------
// 2. CARGA DE LA LIBRERÍA
// ----------------------------------------------------------------------
// Ahora sí cargamos el cerebro musical desde tu carpeta local
if (typeof EssentiaWASM === 'undefined') {
    try {
        importScripts('/essentia-wasm.web.js');
    } catch (e) {
        console.error("Fallo al importar script:", e);
    }
}

let essentia = null;

// ----------------------------------------------------------------------
// 3. LÓGICA DEL WORKER
// ----------------------------------------------------------------------
self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'init') {
        try {
            // Inicializamos el motor.
            // false = Usar este worker, no crear otro interno (ya estamos en uno)
            essentia = new EssentiaWASM(false);
            
            // Esperamos a que el motor WASM arranque
            essentia.module.onRuntimeInitialized = () => {
                self.postMessage({ type: 'ready' });
            };
            
            // A veces carga tan rápido que el evento anterior ya pasó
            if (essentia.module.calledRun) {
                 self.postMessage({ type: 'ready' });
            }

        } catch (err) {
            // Si falla aquí, verás el mensaje exacto
            self.postMessage({ type: 'error', message: 'Error Init: ' + err.message });
        }
    }

    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Motor no iniciado (Espera a "ready")' });
            return;
        }

        try {
            // Convertimos el audio a un formato que C++ entienda (Vector)
            const vectorAudio = essentia.arrayToVector(audio);

            // --- ALGORITMOS MÁGICOS ---
            // 1. BPM (Ritmo)
            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            
            // 2. Key (Tonalidad)
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');

            // Devolvemos el resultado limpio
            self.postMessage({ 
                type: 'result', 
                bpm: Math.round(bpmAlgo.bpm), 
                key: `${keyAlgo.key} ${keyAlgo.scale}` 
            });

            // Limpieza de memoria (importante en WASM)
            vectorAudio.delete();
            bpmAlgo.delete();
            keyAlgo.delete();

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Análisis: ' + err.message });
        }
    }
});