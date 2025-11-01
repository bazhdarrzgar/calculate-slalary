import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React compiler for better performance
  reactStrictMode: true,
  
  // Enable optimizations
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for pdfkit and fontkit modules
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });
      
      // Ignore node: protocol imports
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        zlib: false,
        crypto: false,
      };
    }
    
    // Handle pdfkit data files
    config.module.rules.push({
      test: /\.afm$/,
      type: 'asset/source',
    });
    
    return config;
  },
};

export default nextConfig;
