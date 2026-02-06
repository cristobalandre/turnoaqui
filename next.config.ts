/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Configuración de Imágenes (INTACTA)
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'pynaormfmxkzonmjyxyy.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' }, // Agregué Unsplash por si usas fotos de ahí en el perfil
    ],
  },

  // 2. Solución al Error de Build (INTACTA)
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,    
        path: false,  
        crypto: false 
      };
    }
    return config;
  },

  // 3. Headers de Seguridad para Audio/WASM (CORREGIDO GLOBALMENTE)
  async headers() {
    return [
      {
        //  CAMBIO CLAVE: Aplicamos esto a TODO el sitio (/(.*)), no solo a /projects
        // Esto arregla el error en /dashboard/witness
        source: '/(.*)', 
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // Esto permite activar el motor musical potente
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;