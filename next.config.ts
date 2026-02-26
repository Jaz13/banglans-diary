import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
