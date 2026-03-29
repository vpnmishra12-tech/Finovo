import type {NextConfig} from 'next';

const isExport = process.env.NEXT_PUBLIC_IS_EXPORT === 'true';

const nextConfig: NextConfig = {
  // CRITICAL: Next.js 15 Static Export mode for APK builds
  output: isExport ? 'export' : undefined,
  images: {
    unoptimized: true,
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  distDir: isExport ? 'out' : '.next',
  webpack: (config) => {
    // CRITICAL: Next.js 15 bypass for 'Server Actions are not supported with static export'
    // We alias the centralized server-actions file to false during export build.
    if (isExport) {
      config.resolve.alias['@/ai/server-actions'] = false;
    }
    return config;
  },
};

export default nextConfig;
