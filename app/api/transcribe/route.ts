import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// ✅ CORRECTO: Leemos la clave desde las variables de entorno ocultas
// Si no encuentra la clave, fallará de forma segura en lugar de exponerla.
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY 
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió audio' }, { status: 400 });
    }

    console.log("🚀 Enviando audio a Groq (Whisper Large V3)...");

    // Enviamos a la Supercomputadora de Groq
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3', // El modelo más potente del mundo (Nivel YouTube)
      response_format: 'json',
      language: 'es',           // Forzamos Español
      temperature: 0.0          // Precisión máxima, cero creatividad
    });

    console.log("✅ Transcripción recibida:", transcription.text.substring(0, 50) + "...");

    return NextResponse.json({ text: transcription.text });

  } catch (error: any) {
    console.error('❌ Error en Groq:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}