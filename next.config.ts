
import type {NextConfig} from 'next';

const isExport = process.env.NEXT_PUBLIC_IS_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Use export only for APK builds to avoid Next.js 15 Server Action conflicts
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
    // CRITICAL: When exporting for APK, we completely strip the AI directory
    // This prevents Next.js 15 from finding 'use server' directives during static analysis
    if (isExport) {
      config.resolve.alias['@/ai'] = false;
    }
    return config;
  },
};

export default nextConfig;
