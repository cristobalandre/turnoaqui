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
    ],
  },

  // 2. Solución al Error de Build
  // Esto arregla el error "Module not found: Can't resolve 'fs'" de Essentia.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,    // Ignora sistema de archivos (Node) en el navegador
        path: false,  // Ignora rutas de servidor
        crypto: false // Ignora criptografía de servidor
      };
    }
    return config;
  },

  // 3. Headers de Seguridad para Audio/WASM (INTACTO)
  async headers() {
    return [
      {
        source: '/projects/:path*', 
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;