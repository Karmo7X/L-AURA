import type { NextConfig } from "next";

// Product photos uploaded in /admin live in Supabase Storage.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseImages = supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [];
// A local Supabase (`supabase start`) serves images from 127.0.0.1, which the
// image optimiser refuses by default. Allow it in development only.
const localSupabase =
  process.env.NODE_ENV !== "production" && !!supabaseUrl && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(supabaseUrl);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Product photography exported from the Stitch design. Swap for your own
    // hosted images (or /public) before going to production.
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/aida-public/**"),
      new URL("https://lh3.googleusercontent.com/aida/**"),
      ...supabaseImages,
    ],
    qualities: [75, 85],
    ...(localSupabase ? { dangerouslyAllowLocalIP: true } : {}),
  },
  experimental: {
    // product photos can be up to 5 MB; leave room for the form around them
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
