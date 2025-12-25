/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Auth Images
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub Auth Images
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com', // youtube thumbnails
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com', // youtube thumbnails
      },
    ],
  },
};

export default nextConfig;