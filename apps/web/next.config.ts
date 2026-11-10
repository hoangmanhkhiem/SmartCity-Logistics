import type { NextConfig } from "next";

/** NestJS (mặc định 3001) — tránh trùng cổng với Next (3000). */
const backendProxyTarget =
  process.env.BACKEND_PROXY_TARGET || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
