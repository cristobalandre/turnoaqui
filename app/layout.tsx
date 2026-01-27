import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 👇 1. IMPORTAMOS EL COMPONENTE PROVIDERS (Que debiste crear en app/providers.tsx)
import { Providers } from "./providers";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 👇 2. AGREGAMOS suppressHydrationWarning (Evita errores de consola por el cambio de tema)
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 👇 3. ENVOLVEMOS TODO EL CONTENIDO AQUÍ */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}