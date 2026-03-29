
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
    // CRITICAL: When exporting for APK, we completely strip the AI flows
    // This is the ONLY way to prevent Next.js 15 from failing on 'use server' directives
    if (isExport) {
      config.resolve.alias['@/ai/flows/extract-text-expense'] = false;
      config.resolve.alias['@/ai/flows/extract-bill-photo-expense'] = false;
      config.resolve.alias['@/ai/flows/extract-voice-expense'] = false;
      config.resolve.alias['@/ai/flows/agent-advisor-flow'] = false;
      config.resolve.alias['@/ai/flows/bill-audit-flow'] = false;
      config.resolve.alias['@/ai/flows/subscription-detector-flow'] = false;
      config.resolve.alias['@/ai/genkit'] = false;
    }
    return config;
  },
};

export default nextConfig;
