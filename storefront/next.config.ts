import type { NextConfig } from "next";

// CSP en Report-Only: NO bloquea, solo reporta violaciones a la consola del
// navegador para poder afinarla antes de hacerla obligatoria. Cubre las
// fuentes conocidas (Shopify, Klaviyo, GA + scripts/estilos inline de Next).
// 'unsafe-inline' es pragmático de inicio; el siguiente paso es migrar a
// nonces y pasar a `Content-Security-Policy` a secas.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.klaviyo.com https://www.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cdn.shopify.com https://*.klaviyo.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.myshopify.com https://a.klaviyo.com https://*.klaviyo.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src https://*.klaviyo.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  // Fuerza HTTPS. Sin `preload` de inicio (es difícil de revertir); añadir
  // `; preload` cuando todos los subdominios estén confirmados en HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // anti-clickjacking (+ frame-ancestors)
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN — productos, metaobjects (hero slides), cualquier asset
      // de la tienda. Path liberal porque la URL varía según store ID.
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  // NOTA: Amplify sirve este app como Next SSR/ISR, así que headers() aplica.
  // Si en producción no aparecen, replicarlos como customHeaders en Amplify.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
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
