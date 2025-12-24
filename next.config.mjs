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
        hostname: 'lh3.googleusercontent.com', // Allow Google User Images
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Allow GitHub User Images
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allow images from your Supabase Storage
      },
    ],
  },
};

export default nextConfig;