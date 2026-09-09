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
    <div className="mb-10">
      {/* El eyebrow de una categoría es genérico ("Hombre", "Catálogo"): va en
          gris. El cuero queda reservado a sus cuatro usos, y uno repetido en
          cada listado deja de leerse como acento. */}
      <p className="eyebrow text-xs text-text-muted mb-2">{t(eyebrow)}</p>
      <h1 className="display-l text-text mb-3">{t(title)}</h1>
      <p className="cuerpo-l medida-lectura text-text-muted">{t(description)}</p>
    </div>
  )
}
