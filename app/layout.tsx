import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
//  1. MANTENEMOS TU IMPORTACIÓN ORIGINAL
import { Providers } from "./providers";

//  2. NUEVOS IMPORTS NECESARIOS PARA LA SEGURIDAD
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import WaitingRoom from "@/components/auth/WaitingRoom"; // Asegúrate de que la ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgendaPro - Estudio de Grabación",
  description: "Sistema de gestión de agenda para estudio de grabación",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //  3. LÓGICA DE SEGURIDAD (PORTERO)
  // Antes de pintar nada, verificamos quién es el usuario
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let isPending = false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Si existe, consultamos su estado en la tabla 'profiles'
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_status")
      .eq("id", user.id)
      .single();

    // Si su estado es 'pending', activamos la bandera
    if (profile?.plan_status === "pending") {
      isPending = true;
    }
  }

  return (
    //  4. TU ESTRUCTURA VISUAL INTACTA
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/*  5. AQUÍ OCURRE LA MAGIA:
              Si está pendiente -> Muestra Sala de Espera.
              Si no -> Muestra el sitio normal (children). */}
          {isPending ? <WaitingRoom /> : children}
        </Providers>
      </body>
    </html>
  );
}