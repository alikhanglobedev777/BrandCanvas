import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@brandcanvas/ui", "@brandcanvas/contracts"],
};

export default nextConfig;
