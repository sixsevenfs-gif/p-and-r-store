import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Render's free web service can be overwhelmed when Next optimizes dozens
    // of product images concurrently. The source JPEGs are already web-sized,
    // so serve them directly and keep every device on the same reliable path.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl
      ? [{ protocol: "https", hostname: new URL(supabaseUrl).hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
