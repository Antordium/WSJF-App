import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for better compatibility
  experimental: {
    // Enable optimizePackageImports for better performance
    optimizePackageImports: ['lucide-react'],
  },
  // Ensure TypeScript checking is strict
  typescript: {
    // During builds, continue even if there are type errors
    ignoreBuildErrors: false,
  },
  // ESLint configuration
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
  },
  // Configure output for static export if needed
  // output: 'export',
  
  // Add transpiling for any problematic packages
  transpilePackages: [],
  
  // Configure webpack for better builds
  webpack: (config, { dev, isServer }) => {
    // Ensure proper handling of TypeScript files
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', ...config.resolve.extensions];
    
    return config;
  },
};

export default nextConfig;
