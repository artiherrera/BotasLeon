"use client"

import { useT } from "@/lib/i18n/context"

/**
 * CategoryHeader — encabezado (eyebrow + título + descripción) de una página de
 * categoría. Client component para traducir la interfaz (ES/EN).
 *
 * Recibe LLAVES del diccionario. Como t() devuelve la llave tal cual si no
 * existe, las sub-rutas que aún pasen texto literal (ej. /mujer/vaqueras)
 * degradan a español sin romperse.
 */
export function CategoryHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  const t = useT()
  return (
    <div className="mb-8">
      <p className="eyebrow text-leather mb-2">{t(eyebrow)}</p>
      <h1 className="font-display text-4xl md:text-5xl text-text mb-3">{t(title)}</h1>
      <p className="text-text-muted max-w-xl">{t(description)}</p>
    </div>
  )
}
