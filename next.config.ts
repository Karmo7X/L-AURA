import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Product photography exported from the Stitch design. Swap for your own
    // hosted images (or /public) before going to production.
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/aida-public/**"),
      new URL("https://lh3.googleusercontent.com/aida/**"),
    ],
    qualities: [75, 85],
  },
};

export default nextConfig;
