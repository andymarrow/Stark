/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Disable React Strict Mode (Agora hates double-mounting in dev)
  reactStrictMode: false, 
  
  // 2. Force Next.js to transpile these packages
  transpilePackages: ['agora-rtc-react', 'agora-rtc-sdk-ng'],

  

  images: {
    unoptimized: true, 
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'www.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { 
        protocol: 'https', 
        hostname: 'youtu.be' 
      },
    ],
  },

  // 4. Fix webpack for Agora
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

export default nextConfig;