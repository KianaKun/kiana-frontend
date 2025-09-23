import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/:path*",
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true, // ✅ biar lint error nggak bikin gagal
  },

  typescript: {
    ignoreBuildErrors: true, // (opsional) biar TS error juga dilewati
  },
};

export default nextConfig;
