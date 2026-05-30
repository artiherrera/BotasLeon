import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN — productos, metaobjects (hero slides), cualquier asset
      // de la tienda. Path liberal porque la URL varía según store ID.
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
