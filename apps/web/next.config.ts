import type { NextConfig } from "next";

/** NestJS (mặc định 3001) — tránh trùng cổng với Next (3000). */
const backendProxyTarget =
  process.env.BACKEND_PROXY_TARGET || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/logistics/dashboard", destination: "/he-thong/du-lieu", permanent: false },
      { source: "/delivery/dashboard", destination: "/doanh-nghiep", permanent: false },
      { source: "/regulator/dashboard", destination: "/co-quan", permanent: false },
      { source: "/regulator/reports", destination: "/co-quan", permanent: false },
      { source: "/shipper/today", destination: "/thanh-vien/ban-do", permanent: false },
      { source: "/consumer", destination: "/cong-khai", permanent: false },
    ];
  },
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
