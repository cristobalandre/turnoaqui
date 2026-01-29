import { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export const useAudioProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Instancia única de FFmpeg (para no cargarla mil veces)
  const ffmpegRef = useRef<any>(null);

  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = createFFmpeg({ log: true });
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    }
    return ffmpegRef.current;
  };

  const compressAudio = async (file: File): Promise<File | null> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = await loadFFmpeg();
      
      const fileName = 'input_audio';
      const outputName = 'output.ogg'; // Usamos OGG Opus (Calidad/Peso insuperable)

      // 1. Escribir archivo en memoria
      ffmpeg.FS('writeFile', fileName, await fetchFile(file));

      // Callback para la barra de progreso
      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        setProgress(Math.round(ratio * 100));
      });

      // 2. COMANDO MÁGICO DE COMPRESIÓN
      // -map 0:a : Selecciona solo audio (elimina portadas/video si hubiera)
      // -b:a 96k : 96kbps en Opus es equivalente a mp3 320kbps (calidad transparente)
      await ffmpeg.run('-i', fileName, '-c:a', 'libopus', '-b:a', '96k', outputName);

      // 3. Leer resultado
      const data = ffmpeg.FS('readFile', outputName);

      // 4. Convertir a File object para subir a Supabase
      const processedBlob = new Blob([data.buffer], { type: 'audio/ogg' });
      const processedFile = new File([processedBlob], file.name.replace(/\.[^/.]+$/, "") + ".ogg", {
        type: 'audio/ogg',
        lastModified: Date.now(),
      });

      // Limpieza de memoria
      ffmpeg.FS('unlink', fileName);
      ffmpeg.FS('unlink', outputName);

      return processedFile;

    } catch (error) {
      console.error("Error en la máquina de compresión:", error);
      alert("Error al procesar el audio. Se intentará subir el original.");
      return null; // Si falla, devolvemos null para que uses el original
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return { compressAudio, isProcessing, progress };
};