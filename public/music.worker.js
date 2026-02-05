// ----------------------------------------------------------------------
// 1. EL TRUCO DE MAGIA (Polyfill Definitivo) 🎩✨
// ----------------------------------------------------------------------
// Engañamos a la librería definiendo 'window' y 'document' falsos.
if (typeof self.window === 'undefined') self.window = self;
if (typeof self.document === 'undefined') {
    self.document = {
        createElement: () => ({}), // Devuelve objeto vacío si intenta crear algo
        addEventListener: () => {}, 
        querySelector: () => null,
        getElementById: () => null
    };
}

// ----------------------------------------------------------------------
// 2. CARGA DE LA LIBRERÍA LOCAL
// ----------------------------------------------------------------------
if (typeof EssentiaWASM === 'undefined') {
    try {
        importScripts('/essentia-wasm.web.js');
    } catch (e) {
        self.postMessage({ type: 'error', message: 'No se encontró essentia-wasm.web.js en public/' });
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
            // En esta versión, 'essentia' ya es el objeto Módulo directamente.
            essentia = new EssentiaWASM({
                onRuntimeInitialized: () => {
                     self.postMessage({ type: 'ready' });
                }
            });
            
            // Si carga instantáneo (síncrono), avisamos igual.
            // Usamos setTimeout para asegurar que el hilo principal esté escuchando.
            if (essentia instanceof Promise) {
                 // Si es una versión moderna que devuelve promesa
                 essentia.then((mod) => {
                     essentia = mod;
                     self.postMessage({ type: 'ready' });
                 });
            } else {
                 // Versión clásica
                 setTimeout(() => {
                     if(!essentia.calledRun) self.postMessage({ type: 'ready' });
                 }, 100);
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
            // Convertimos audio a Vector de C++
            const vectorAudio = essentia.arrayToVector(audio);

            // Algoritmos (Verificamos que existan antes de llamar)
            if (!essentia.PercivalBpmEstimator || !essentia.KeyExtractor) {
                throw new Error("Algoritmos no encontrados en WASM");
            }

            const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
            const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');

            self.postMessage({ 
                type: 'result', 
                bpm: Math.round(bpmAlgo.bpm), 
                key: `${keyAlgo.key} ${keyAlgo.scale}` 
            });

            // Limpieza de memoria C++
            vectorAudio.delete();
            bpmAlgo.delete();
            keyAlgo.delete();

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Análisis: ' + err.message });
        }
    }
});