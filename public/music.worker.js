// ----------------------------------------------------------------------
// 🕵️‍♂️ MUSIC WORKER: VERSIÓN "MOTOR PRE-ENCENDIDO" (CON PROTECCIÓN)
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

    // --- INICIALIZACIÓN (ESTO YA FUNCIONABA, SE MANTIENE IGUAL) ---
    if (type === 'init') {
        try {
            let EssentiaClass = self.Essentia; 
            if (!EssentiaClass && self.Essentia && self.Essentia.Essentia) {
                EssentiaClass = self.Essentia.Essentia;
            }

            if (!EssentiaClass) throw new Error("No se encontró la clase Essentia.");

            const wasmModule = await EssentiaWASM({
                onRuntimeInitialized: () => { console.log("wasm init event"); }
            });

            essentia = new EssentiaClass(wasmModule, false);

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

    // --- ANÁLISIS (AQUÍ ESTÁ LA CORRECCIÓN) ---
    if (type === 'analyze') {
        if (!essentia) {
            self.postMessage({ type: 'error', message: 'Motor no iniciado' });
            return;
        }

        try {
            // 🛡️ PROTECCIÓN NUEVA: Si el audio es muy corto o vacío, cancelamos para no romper el motor
            if (!audio || audio.length < 4096) { 
                console.warn("Audio demasiado corto para analizar");
                self.postMessage({ 
                    type: 'result', 
                    bpm: 0, 
                    key: "-" 
                });
                return;
            }

            const vectorAudio = essentia.arrayToVector(audio);
            
            // Usamos valores por defecto por si un algoritmo falla individualmente
            let bpmValue = 0;
            let keyValue = "-";

            try {
                const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
                bpmValue = Math.round(bpmAlgo.bpm);
            } catch(e) { console.warn("Fallo cálculo BPM", e); }

            try {
                const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');
                keyValue = `${keyAlgo.key} ${keyAlgo.scale}`;
            } catch(e) { console.warn("Fallo cálculo Key", e); }

            self.postMessage({ 
                type: 'result', 
                bpm: bpmValue, 
                key: keyValue
            });

        } catch (err) {
            console.error(err);
            // Mensaje de error seguro (evita el "undefined")
            const msg = err.message ? err.message : "Error desconocido en worker";
            self.postMessage({ type: 'error', message: 'Error Análisis: ' + msg });
        }
    }
});