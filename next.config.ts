
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set trailingSlash to false for Capacitor to ensure index.html is at the root
  trailingSlash: false,
  distDir: 'out',
};

export default nextConfig;
