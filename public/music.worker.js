// ✅ MODO LOCAL: Cargamos los archivos desde tu propia carpeta public.
// Esto elimina los errores de red/bloqueo de CDN para siempre.
importScripts('/essentia-wasm.web.js');

// La librería se carga en el objeto global 'self'
const EssentiaWASM = self.EssentiaWASM;
let essentia = null;

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'init') {
        try {
            // false = Usar este worker.
            // Al estar en local, buscará automáticamente 'essentia-wasm.web.wasm' al lado.
            essentia = new EssentiaWASM(false);
            
            // Espera de seguridad
            essentia.module.onRuntimeInitialized = () => {
                self.postMessage({ type: 'ready' });
            };
            
            if (essentia.module.calledRun) {
                 self.postMessage({ type: 'ready' });
            }

        } catch (err) {
            self.postMessage({ type: 'error', message: 'Error Init Local: ' + err.message });
        }
    }

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