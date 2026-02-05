// ----------------------------------------------------------------------
// 🕵️‍♂️ MUSIC WORKER: VERSIÓN "MOTOR PRE-ENCENDIDO"
// ----------------------------------------------------------------------

// 1. POLYFILLS
if (typeof self.window === 'undefined') self.window = self;
if (typeof self.document === 'undefined') {
    self.document = { createElement: () => ({}), addEventListener: () => {}, querySelector: () => null };
}

// 2. IMPORTACIONES
try {
    importScripts('/essentia-wasm.web.js'); 
    importScripts('/essentia.js');
} catch (e) {
    self.postMessage({ type: 'error', message: 'Fallo importando scripts: ' + e.message });
}

let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    // --- INICIALIZACIÓN ---
    if (type === 'init') {
        try {
            // 🧠 DETECCIÓN DE CLASE
            let EssentiaClass = self.Essentia; 
            // Si está escondida en un namespace, la buscamos
            if (!EssentiaClass && self.Essentia && self.Essentia.Essentia) {
                EssentiaClass = self.Essentia.Essentia;
            }

            if (!EssentiaClass) throw new Error("No se encontró la clase Essentia.");

            // 🚀 CORRECCIÓN CLAVE: ENCENDEMOS EL MOTOR PRIMERO
            // 'EssentiaWASM' es la fábrica. La ejecutamos y esperamos a que el motor nazca.
            const wasmModule = await EssentiaWASM({
                onRuntimeInitialized: () => { console.log("wasm init event"); }
            });

            // Ahora sí: Pasamos el 'wasmModule' (el objeto REAL) a la clase.
            // Antes pasábamos 'EssentiaWASM' (la función) y por eso fallaba.
            essentia = new EssentiaClass(wasmModule, false);

            // Verificamos que los algoritmos existan
            if (essentia.PercivalBpmEstimator) {
                console.log("✅ Motor Essentia 100% Operativo");
                self.postMessage({ type: 'ready' });
            } else {
                throw new Error("El motor cargó pero faltan algoritmos.");
            }

        } catch (err) {
            console.error("❌ Error Init:", err);
            self.postMessage({ type: 'error', message: 'Error Init: ' + err.message });
        }
    }

    // --- ANÁLISIS ---
    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Motor no iniciado' });
            return;
        }

        try {
            const vectorAudio = essentia.arrayToVector(audio);
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