import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚫 Matikan ESLint check waktu build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 🚫 Matikan TypeScript check waktu build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Kalau pakai rewrites ke backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/:path*",
      },
    ];
  },
  // Untuk GitHub Pages (static export)
  output: "export",
  images: {
    unoptimized: true, // karena GitHub Pages ga support Image Optimization
  },
};

export default nextConfig;
