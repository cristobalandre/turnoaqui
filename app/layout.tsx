import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Imports de seguridad
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import WaitingRoom from "@/components/auth/WaitingRoom";

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
  // 👇 AQUÍ ESTÁ EL CAMBIO CLAVE: Agregamos 'await'
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Ahora cookieStore ya es el objeto real, no una promesa
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_status")
      .eq("id", user.id)
      .single();

    if (profile?.plan_status === "pending") {
      isPending = true;
    }
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {isPending ? <WaitingRoom /> : children}
        </Providers>
      </body>
    </html>
  );
}