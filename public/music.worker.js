// ----------------------------------------------------------------------
// 1. CARGA DE LIBRERÍAS (Motor + Traductor)
// ----------------------------------------------------------------------
// Polyfills: Engañamos a la librería para que crea que hay un navegador real
if (typeof self.window === 'undefined') self.window = self;
if (typeof self.document === 'undefined') {
    self.document = { 
        createElement: () => ({}), 
        addEventListener: () => {}, 
        querySelector: () => null 
    };
}

// CARGAMOS LOS DOS ARCHIVOS QUE DESCARGASTE:
try {
    importScripts('/essentia-wasm.web.js'); // El Motor (Cerebro)
    importScripts('/essentia.js');          // El Traductor (Lenguaje)
} catch (e) {
    self.postMessage({ type: 'error', message: 'Faltan archivos en public/: ' + e.message });
}

let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    // --- INICIALIZACIÓN ---
    if (type === 'init') {
        try {
            // Usamos la clase 'Essentia' (del archivo nuevo) que envuelve al motor.
            // Esto conecta el JS con el WASM automáticamente.
            // false = No usar worklet interno (ya estamos en un worker)
            essentia = new Essentia(EssentiaWASM, false);

            // Esperamos a que el motor arranque revisando si las funciones existen
            const checkReady = () => {
                // Si estas funciones existen, el motor cargó bien
                if (essentia.PercivalBpmEstimator && essentia.KeyExtractor) {
                    self.postMessage({ type: 'ready' });
                } else {
                    // Si no, esperamos 100ms y volvemos a preguntar
                    setTimeout(checkReady, 100); 
                }
            };
            checkReady();

        } catch (err) {
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
            // Convertimos el audio a Vector (formato que entiende C++)
            const vectorAudio = essentia.arrayToVector(audio);

            // 1. BPM (Ritmo)
            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            
            // 2. KEY (Nota Musical)
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');

            self.postMessage({ 
                type: 'result', 
                bpm: Math.round(bpmAlgo.bpm), 
                key: `${keyAlgo.key} ${keyAlgo.scale}` 
            });

            // Limpieza (Opcional en JS moderno pero buena práctica en WASM)
            // vectorAudio.delete(); 

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Análisis: ' + err.message });
        }
    }
});