import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const logToConsole = async (msg: string, details: any = '') => {
  // 1. Mostrar en la consola normal (por si acaso)
  console.log(msg, details);

  try {
    // 2. Enviar a la Base de Datos (La Magia)
    await supabase.from('debug_logs').insert({
      device: navigator.userAgent.includes('iPhone') ? '📱 iPHONE' : '💻 PC/OTRO',
      error_message: msg,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details)
    });
  } catch (err) {
    // Si falla el log, no podemos hacer mucho más
    console.error("Error enviando log remoto", err);
  }
};