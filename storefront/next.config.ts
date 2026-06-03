import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN — productos, metaobjects (hero slides), cualquier asset
      // de la tienda. Path liberal porque la URL varía según store ID.
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async redirects() {
    // Consolidamos toda la jerarquía bajo /nino (singular) para evitar
    // contenido duplicado SEO. /ninos y sus hijos quedan como 308 permanente.
    return [
      { source: "/ninos", destination: "/nino", permanent: true },
      { source: "/ninos/:path*", destination: "/nino/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
