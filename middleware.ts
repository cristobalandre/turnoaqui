import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 🟢 AHORA SÍ: Llamamos a la función que conecta con Supabase
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Se ejecuta en todas las páginas excepto archivos estáticos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};