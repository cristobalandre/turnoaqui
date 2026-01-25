import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // ✅ middleware neutro: NO rompe producción
  return NextResponse.next();
}

// opcional: evita tocar assets internos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
