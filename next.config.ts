import type { NextConfig } from "next";

// Cache Components stay off: almost every page is personal (feed, stash,
// review), so classic dynamic rendering is the simplest correct model.
const nextConfig: NextConfig = {
  images: {
    // Book covers come from Google Books / Open Library; serving them as-is keeps
    // the app inside Vercel's free tier (no image optimization quota).
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
