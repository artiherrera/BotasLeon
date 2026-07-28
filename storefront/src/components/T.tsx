"use client"

import { useT } from "@/lib/i18n/context"

/**
 * <T> — isla cliente para traducir UN texto inline dentro de un SERVER component
 * que no puede usar el hook useT (porque es async / hace fetch de datos).
 *
 * Uso: <T k="related.moreBoots" />  o con interpolación: <T k="x" vars={{ n: "3" }} />
 * Renderiza el texto traducido según el idioma actual. Si la llave no existe,
 * t() devuelve la llave tal cual (degradación segura).
 */
export function T({ k, vars }: { k: string; vars?: Record<string, string> }) {
  const t = useT()
  let s = t(k)
  if (vars) {
    for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, v)
  }
  return <>{s}</>
}
