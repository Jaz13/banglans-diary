import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable gzip compression for all responses
  compress: true,
  // Remove X-Powered-By header
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    staleTimes: {
      // Cache dynamic pages for 60s on client — navigating back is instant
      dynamic: 60,
      // Cache static pages for 5 minutes
      static: 300,
    },
    // Optimized imports for tree-shaking heavy libraries
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    // Serve modern formats automatically
    formats: ['image/avif', 'image/webp'],
    // Responsive image sizes for mobile/tablet/desktop
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Supabase proxy is now handled by app/sb/[...path]/route.ts
  // (API route that strips cookie domains, unlike Vercel rewrites)
};

export default nextConfig;
