/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. CONFIGURACIÓN DE IMÁGENES (Aquí está la magia para Google)
  images: {
    dangerouslyAllowSVG: true, // Para los avatares de DiceBear
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      //  PERMISO UNIVERSAL PARA FOTOS DE GOOGLE (lh3, lh4, etc.)
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      
      // Permisos para tus otras fuentes
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'pynaormfmxkzonmjyxyy.supabase.co' },
    ],
  },

  // 2. HEADERS DE SEGURIDAD (Para que la máquina de audio funcione)
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
            // ESTA LÍNEA ES VITAL PARA EL AUDIO Y LAS SUBIDAS
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;