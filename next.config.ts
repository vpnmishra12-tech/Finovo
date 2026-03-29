
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
  webpack: (config, { isServer }) => {
    // CRITICAL: When exporting for APK, we redirect all AI flow imports to an empty object
    // This prevents the "Server Actions are not supported with static export" error
    if (isExport && !isServer) {
      config.resolve.alias['@/ai/flows'] = false;
      // Also catch direct imports just in case
      config.resolve.alias['@/ai'] = false;
    }
    return config;
  },
};

export default nextConfig;
