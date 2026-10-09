"use client"

import type { ReactNode } from "react"
import { useT } from "@/lib/i18n/context"

/**
 * CategoryHeader — encabezado (eyebrow + título + descripción) de una página de
 * categoría. Client component para traducir la interfaz (ES/EN).
 *
 * Recibe LLAVES del diccionario. Como t() devuelve la llave tal cual si no
 * existe, las sub-rutas que aún pasen texto literal (ej. /mujer/vaqueras)
 * degradan a español sin romperse.
 *
 * `compacto` es para el catálogo: ahí la cabecera no es el contenido, son las
 * botas. En la versión alta la primera bota empezaba a 533px del borde — media
 * pantalla de portátil gastada en un eyebrow que repite el título. Compacta
 * suelta el eyebrow, baja el título un escalón y aprieta los márgenes.
 *
 * `children` sale a la derecha del título (el visor del catálogo en PDF), en
 * lugar de ocupar su propio renglón debajo.
 */
export function CategoryHeader({
  eyebrow,
  title,
  description,
  compacto = false,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  compacto?: boolean
  children?: ReactNode
}) {
  const t = useT()
  return (
    <div
      className={
        compacto
          ? "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
          : "mb-10"
      }
    >
      <div className="min-w-0">
        {/* El eyebrow de una categoría es genérico ("Hombre", "Catálogo"): va en
            gris. El cuero queda reservado a sus cuatro usos, y uno repetido en
            cada listado deja de leerse como acento. */}
        {!compacto && (
          <p className="eyebrow text-xs text-text-muted mb-2">{t(eyebrow)}</p>
        )}
        <h1 className={`text-text ${compacto ? "display-m mb-2" : "display-l mb-3"}`}>
          {t(title)}
        </h1>
        <p
          className={`medida-lectura text-text-muted ${
            compacto ? "cuerpo" : "cuerpo-l"
          }`}
        >
          {t(description)}
        </p>
      </div>
      {children}
    </div>
  )
}
