// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Client-side configurations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    
    // Handle PDF libraries
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Ignore canvas package for jsPDF (not needed for basic functionality)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      })
    );
    
    return config;
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Handle static optimization
  trailingSlash: false,
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'WSJF Calculator',
  },
};

export default nextConfig;
