import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/checkout/success",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, private",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
