import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// ✅ CORRECTO: Sin la clave escrita. Solo process.env
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

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3', 
      response_format: 'json',
      language: 'es',           
      temperature: 0.0          
    });

    console.log("✅ Transcripción recibida:", transcription.text.substring(0, 50) + "...");

    return NextResponse.json({ text: transcription.text });

  } catch (error: any) {
    console.error('❌ Error en Groq:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}