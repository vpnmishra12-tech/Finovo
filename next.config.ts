import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Fix for "Cross origin request detected" in cloud workstations
  experimental: {
    allowedDevOrigins: [
      '9000-firebase-studio-1773832578527.cluster-ubrd2huk7jh6otbgyei4h62ope.cloudworkstations.dev',
      '*.cloudworkstations.dev',
      '*.google.com'
    ]
  }
};

export default nextConfig;
