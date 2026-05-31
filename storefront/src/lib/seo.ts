/**
 * SEO helpers — usados por sitemap, structured data, y metadata
 * generators. Centraliza el BASE_URL para que cambie de Amplify
 * a custom domain solo tocando la env var.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://main.dlrgtndu7af79.amplifyapp.com"

export const SITE_NAME = "BotasLeón"
export const SITE_DESCRIPTION =
  "Comercializadora de botas mexicanas hechas en León, Guanajuato. Vaqueras, clásicas, exóticas y de rancho — curadas par por par. Envío a México y Estados Unidos."

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}
