import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',
  
  // Webpack configuration for PDF libraries
  webpack: (config, { isServer }) => {
    // Handle canvas dependency for jsPDF
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  
  // Enable experimental features if needed
  experimental: {
    esmExternals: true,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'wsjf-calculator',
  },
};

export default nextConfig;
