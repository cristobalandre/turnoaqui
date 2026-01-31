import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  console.log("🔵 Callback iniciado: Recibiendo petición de Google..."); // LOG 1

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    console.log("✅ Código detectado. Intercambiando por sesión..."); // LOG 2
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log("🚀 ÉXITO: Sesión creada. Redirigiendo a Dashboard..."); // LOG 3
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("🔴 ERROR SUPABASE:", error.message); // LOG DE ERROR
    }
  } else {
    console.log("⚠️ No se recibió ningún código de Google.");
  }

  // Si falló, devuelve al login con error visual
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}