/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. ? CONFIGURACIÓN DE IMÁGENES
  // Esto permite cargar avatares externos aunque tengamos los headers de seguridad estrictos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Para fotos de perfil de Google Auth
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // Para los avatares de ejemplo que usamos
      },
      {
        protocol: 'https',
        hostname: 'pynaormfmxkzonmjyxyy.supabase.co', // ?? TU PROYECTO SUPABASE (Storage)
      },
    ],
  },

  // 2. HEADERS DE SEGURIDAD (Necesarios para FFmpeg/Audio Processor)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;