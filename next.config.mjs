/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'exifr'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lhspnxlyshdouaubemmm.supabase.co',
      },
    ],
  },
};

export default nextConfig;
