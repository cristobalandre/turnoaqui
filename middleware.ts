import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Ahora sí llamamos a la lógica real de Supabase
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api/ (rutas API)
     * 2. /_next/ (archivos internos de Next.js)
     * 3. /_static (archivos estáticos dentro de /public)
     * 4. /_vercel (archivos internos de Vercel)
     * 5. Archivos con extensión (ej: .svg, .png, .jpg, .css)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};