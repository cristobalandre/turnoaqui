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