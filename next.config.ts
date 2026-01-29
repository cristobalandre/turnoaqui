/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. imágenes externas (Para el componente <Image />)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google
      { protocol: 'https', hostname: 'api.dicebear.com' },          // Avatares
      { protocol: 'https', hostname: 'pynaormfmxkzonmjyxyy.supabase.co' }, // Tu Storage
    ],
  },

  // 2. Headers "Credentialless"
  // Esto permite que FFmpeg funcione SIN romper las imágenes externas.
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
            value: 'credentialless', //  (Antes era 'require-corp')
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;