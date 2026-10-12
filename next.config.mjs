/** @type {import('next').NextConfig} */
const nextConfig = {
  // The certificate renderer reads its fonts from disk at runtime, which
  // file tracing can't see on its own. Server actions run inside the page
  // that calls them, so ship the fonts with the admin routes.
  outputFileTracingIncludes: {
    '/admin/**': ['./lib/certificate/fonts/**'],
  },
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
};

export default nextConfig;