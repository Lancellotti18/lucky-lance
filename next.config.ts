import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standard image formats for Safari compatibility (avoid AVIF on older iOS)
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
