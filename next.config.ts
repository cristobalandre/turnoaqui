/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'pynaormfmxkzonmjyxyy.supabase.co' },
    ],
  },

  async headers() {
    return [
      {
        // EL CAMBIO DRASTICO:
        // Solo activamos los headers estrictos en las rutas de proyectos.
        // El resto del sitio (/login, /dashboard, etc.) queda libre para Google.
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