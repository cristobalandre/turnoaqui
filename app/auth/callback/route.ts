import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Si vienes de Google, al terminar vamos al dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Si falla aquí no es crítico, el middleware terminará el trabajo
            }
          },
        },
      }
    )
    
    // ⚠️ EL MOMENTO CLAVE: Intercambiamos código por sesión en el servidor
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si todo salió bien, redirigimos al usuario ya logueado
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falló, volvemos al login con un error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}