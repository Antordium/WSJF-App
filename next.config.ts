import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Removed output: 'export' for Vercel deployment compatibility
  
  // Optimize for production
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  trailingSlash: false,
  
  images: {
    unoptimized: false,
  },
  
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
