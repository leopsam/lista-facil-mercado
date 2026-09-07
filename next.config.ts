import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.17.62.72"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
