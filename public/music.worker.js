// ----------------------------------------------------------------------
// 🕵️‍♂️ MUSIC WORKER: AUTO-DETECT & DEBUG MODE
// ----------------------------------------------------------------------

// 1. POLYFILLS (Engañamos a la librería)
if (typeof self.window === 'undefined') self.window = self;
if (typeof self.document === 'undefined') {
    self.document = { createElement: () => ({}), addEventListener: () => {}, querySelector: () => null };
}

// 2. CARGAMOS LOS ARCHIVOS
try {
    importScripts('/essentia-wasm.web.js'); 
    importScripts('/essentia.js');
    console.log("✅ Scripts importados correctamente.");
} catch (e) {
    self.postMessage({ type: 'error', message: 'Fallo importando scripts: ' + e.message });
}

let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    // --- INICIALIZACIÓN ---
    if (type === 'init') {
        try {
            // 🔍 DEBUG: ¿Qué tenemos cargado?
            console.log("🔍 Debug EssentiaWASM:", typeof EssentiaWASM);
            console.log("🔍 Debug Essentia:", typeof Essentia);

            // 🧠 AUTO-CORRECCIÓN: Buscamos la clase Essentia donde esté
            let EssentiaClass = null;

            if (typeof Essentia === 'function') {
                EssentiaClass = Essentia; // Caso normal
            } else if (typeof self.Essentia === 'function') {
                EssentiaClass = self.Essentia; // Caso Global
            } else if (self.Essentia && typeof self.Essentia.Essentia === 'function') {
                EssentiaClass = self.Essentia.Essentia; // Caso Namespaced
            }

            if (!EssentiaClass) {
                throw new Error("No se encontró la clase 'Essentia'. Revisa si essentia.js se descargó bien.");
            }

            if (typeof EssentiaWASM !== 'function') {
                throw new Error("No se encontró 'EssentiaWASM'. Revisa essentia-wasm.web.js.");
            }

            // 🚀 ARRANCAMOS EL MOTOR
            // false = No usar worklet interno
            essentia = new EssentiaClass(EssentiaWASM, false);

            const checkReady = () => {
                if (essentia.PercivalBpmEstimator) {
                    console.log("🎵 Motor Essentia Listo!");
                    self.postMessage({ type: 'ready' });
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();

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