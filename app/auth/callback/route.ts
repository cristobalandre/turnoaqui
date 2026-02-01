import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
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
    
    // Intercambiamos el código
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ ÉXITO: Redirigir al dashboard
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // ❌ ERROR DETECTADO: Lo mostramos en pantalla
      return NextResponse.json({ 
        message: 'Error al canjear código de Google', 
        error_completo: error.message,
        hint: 'Revisa las Variables de Entorno en Vercel'
      }, { status: 400 })
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}