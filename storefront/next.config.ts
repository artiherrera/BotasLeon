import type { NextConfig } from "next";

// CSP en Report-Only: NO bloquea, solo reporta violaciones a la consola del
// navegador para poder afinarla antes de hacerla obligatoria. Cubre las
// fuentes conocidas (Shopify, Klaviyo, GA + scripts/estilos inline de Next).
// 'unsafe-inline' es pragmático de inicio; el siguiente paso es migrar a
// nonces y pasar a `Content-Security-Policy` a secas.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.klaviyo.com https://www.googletagmanager.com https://*.google-analytics.com https://js.volumental.com https://*.volumental.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.shopify.com https://*.klaviyo.com https://*.google-analytics.com https://*.googletagmanager.com https://res.cloudinary.com https://review-images.judgeme.com https://*.volumental.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.myshopify.com https://a.klaviyo.com https://*.klaviyo.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://api.cloudinary.com https://judge.me https://api.judge.me https://*.volumental.com",
  "frame-src https://*.klaviyo.com https://www.google.com https://maps.google.com https://*.volumental.com",
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
  // Cámara habilitada para el escaneo de talla (Volumental). El SDK abre la
  // cámara desde su propio origen/iframe, por eso `camera=*` (cualquier origen
  // embebido de confianza); se puede acotar a orígenes específicos más adelante.
  { key: "Permissions-Policy", value: "camera=*, microphone=(), geolocation=()" },
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
  // Sin redirect /ninos → /nino: la sección Niños no existe (páginas sin
  // publicar), así que redirigir ahí solo mandaba a un 404.
};

export default nextConfig;
