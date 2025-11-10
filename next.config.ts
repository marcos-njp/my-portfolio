import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v1.screenshot.11ty.dev',
      },
    ],
  },
};

export default nextConfig;
