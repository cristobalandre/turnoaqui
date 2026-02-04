import { EssentiaWASM } from 'essentia.js';

export const analyzeAudio = async (audioBuffer) => {
    try {
        // CORRECCIÓN CLAVE: 
        // Antes era: new EssentiaWASM.EssentiaWASM(false) -> ESTO FALLABA
        // Ahora es:  new EssentiaWASM(false) -> ESTO FUNCIONA
        const essentia = new EssentiaWASM(false);
        
        const channelData = audioBuffer.getChannelData(0);
        
        // 1. CHEQUEO DE SILENCIO (Evita crasheos si el micro no grabó nada)
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        
        if (rms < 0.005) {
             console.warn("Audio demasiado bajo/silencio detectado.");
             return { bpm: 0, key: "Silencio" };
        }

        const vectorAudio = essentia.arrayToVector(channelData);

        // 2. DETECTAR BPM
        const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
        const bpm = Math.round(bpmAlgo.bpm);

        // 3. DETECTAR KEY
        const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');
        const key = `${keyAlgo.key} ${keyAlgo.scale}`; 

        return { bpm, key };
    } catch (e) {
        console.error("Error analizando música:", e);
        // Devolvemos valores seguros para que no rompa la UI
        return { bpm: 0, key: "Error" };
    }
};