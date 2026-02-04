import { EssentiaWASM } from 'essentia.js';

export const analyzeAudio = async (audioBuffer) => {
    // 1. Iniciamos el motor de audio (WASM)
    const essentia = new EssentiaWASM.EssentiaWASM(false);
    
    // Convertimos el audio a un vector matemático
    const channelData = audioBuffer.getChannelData(0);
    const vectorAudio = essentia.arrayToVector(channelData);

    // 2. DETECTAR BPM (Ritmo)
    // Algoritmo "PercivalBpmEstimator" (Estándar de industria)
    const bpmAlgo = essentia.PercivalBpmEstimator(vectorAudio, 1024, 512, 4096, 0, 210, 50, 0);
    const bpm = Math.round(bpmAlgo.bpm);

    // 3. DETECTAR KEY (Nota/Tonalidad)
    // Algoritmo "KeyExtractor"
    const keyAlgo = essentia.KeyExtractor(vectorAudio, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'hpcp');
    
    // Formateamos para que se vea bonito (Ej: "C" + "Major" -> "C Major")
    const key = `${keyAlgo.key} ${keyAlgo.scale}`; 

    return { bpm, key };
};