/**
 * Social links — fuente única para perfiles oficiales de BotasLeón.
 *
 * Se consume en Footer (iconos), MobileNav (botones), y StructuredData
 * (sameAs en OrganizationJsonLd para que Google conecte la marca con
 * sus perfiles sociales en el Knowledge Graph).
 *
 * Agregar perfil nuevo:
 *   1. Sumar entrada acá con `url` y `label`
 *   2. Sumar el icono SVG en SocialIcons.tsx
 *   3. Auto-aparece en Footer + JSON-LD sin tocar nada más
 *
 * Convención: si un perfil aún no existe, omitirlo (no comentar).
 * El array filtra por `enabled` para que pasen solo los activos.
 */

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "twitter"
  | "youtube"
  | "pinterest"
  | "whatsapp"

export type SocialLink = {
  platform: SocialPlatform
  url: string
  label: string
  enabled: boolean
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "instagram",
    url: "https://www.instagram.com/botasleonmx/",
    label: "Instagram",
    enabled: true,
  },
  {
    platform: "facebook",
    // Profile URL provisional hasta que se claim el vanity URL @BotasLeon.
    url: "https://www.facebook.com/profile.php?id=61590969830695",
    label: "Facebook",
    enabled: true,
  },
  {
    platform: "tiktok",
    url: "",
    label: "TikTok",
    enabled: false,
  },
  {
    platform: "youtube",
    url: "",
    label: "YouTube",
    enabled: false,
  },
]

/** Retorna solo los links activos en orden de declaración. */
export function getActiveSocialLinks(): SocialLink[] {
  return SOCIAL_LINKS.filter((s) => s.enabled && s.url.length > 0)
}

/** URLs para el campo `sameAs` del JSON-LD Organization. */
export function getSameAsUrls(): string[] {
  return getActiveSocialLinks().map((s) => s.url)
}
