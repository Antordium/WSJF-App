// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: 'loose', // Helps with PDF library imports
  },
  webpack: (config, { isServer }) => {
    // Configure fallbacks for client-side PDF libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Ignore server-only modules in client bundle
    config.externals = config.externals || [];
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    return config;
  },
  // Ensure Vercel deployment works correctly
  images: {
    unoptimized: false,
  },
  // Enable static export if needed (uncomment for static sites)
  // output: 'export',
  // trailingSlash: true,
};

export default nextConfig;
