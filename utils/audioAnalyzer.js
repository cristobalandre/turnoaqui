import { EssentiaWASM } from 'essentia.js';

export const analyzeAudio = async (audioBuffer) => {
    try {
        // CORRECCIÓN: Quitamos el doble .EssentiaWASM
        const essentia = new EssentiaWASM(false);
        
        const channelData = audioBuffer.getChannelData(0);
        
        // 1. CHEQUEO DE SILENCIO (Para evitar errores si no se grabó nada)
        // Calculamos el volumen promedio (RMS)
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        
        // Si el volumen es casi cero, cancelamos
        if (rms < 0.01) throw new Error("Audio demasiado silencioso");

        const vectorAudio = essentia.arrayToVector(channelData);

        // 2. DETECTAR BPM
        const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
        const bpm = Math.round(bpmAlgo.bpm);

        // 3. DETECTAR KEY
        const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');
        const key = `${keyAlgo.key} ${keyAlgo.scale}`; 

        return { bpm, key };
    } catch (e) {
        console.warn("No se pudo analizar música:", e);
        return null;
    }
};