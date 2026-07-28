"use client"

import { useLocale } from "@/lib/i18n/context"

/**
 * <Localized> — para PROSA larga en server components (páginas de contenido).
 *
 * En vez de una llave por párrafo, cada página provee dos versiones del bloque
 * (JSX en español e inglés) y este componente cliente renderiza la que
 * corresponde al idioma actual. Ideal para /envios, /nosotros, /terminos, etc.,
 * donde el texto es largo y estructurado (h2, p, ul...).
 *
 * Uso:
 *   <Localized
 *     es={<><p>…español…</p></>}
 *     en={<><p>…english…</p></>}
 *   />
 *
 * Nota: ambas versiones viajan al cliente (payload un poco mayor), aceptable
 * para páginas de contenido. El idioma por defecto (es) coincide con el render
 * del servidor → sin mismatch de hidratación.
 */
export function Localized({
  es,
  en,
}: {
  es: React.ReactNode
  en: React.ReactNode
}) {
  const { locale } = useLocale()
  return <>{locale === "en" ? en : es}</>
}
