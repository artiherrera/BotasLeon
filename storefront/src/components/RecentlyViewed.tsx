"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LocalizedLink as Link } from "@/components/LocalizedLink"
import { useT } from "@/lib/i18n/context"
import { useProductTranslation } from "./LocalizedProductContent"

/**
 * RecentlyViewed — strip "visto recientemente" en el PDP.
 *
 * Persistimos los últimos 6 productos vistos en localStorage. Al cargar
 * el PDP agregamos el producto actual al inicio (dedup), recortamos a 6
 * y guardamos. Para el render filtramos el producto actual — no tiene
 * sentido mostrarlo viéndose a sí mismo.
 *
 * Guardamos { handle, title, image } completos para evitar un fetch
 * extra a Shopify. Trade-off: si el título cambia en admin, vemos el
 * stale hasta que el usuario vuelva a entrar al producto.
 *
 * Si el localStorage no está disponible (SSR, modo privado, etc.) o no
 * hay otros productos, retornamos null silenciosamente.
 */

const STORAGE_KEY = "botasleon:recently-viewed"
const MAX_ITEMS = 6

type ViewedItem = {
  handle: string
  title: string
  image: string | null
}

type Props = {
  currentHandle: string
  currentTitle: string
  currentImage?: string | null
}

export function RecentlyViewed({ currentHandle, currentTitle, currentImage }: Props) {
  const t = useT()
  const [items, setItems] = useState<ViewedItem[]>([])

  useEffect(() => {
    let stored: ViewedItem[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // Filtramos entries malformados — protege contra cambios de schema
          stored = parsed.filter(
            (x): x is ViewedItem =>
              x && typeof x.handle === "string" && typeof x.title === "string"
          )
        }
      }
    } catch {
      // localStorage no disponible o JSON inválido — empezamos limpio
      stored = []
    }

    const current: ViewedItem = {
      handle: currentHandle,
      title: currentTitle,
      image: currentImage ?? null,
    }

    const deduped = [current, ...stored.filter((x) => x.handle !== currentHandle)].slice(
      0,
      MAX_ITEMS
    )

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
    } catch {
      // quota exceeded — no rompemos, solo perdemos persistencia
    }

    setItems(deduped)
  }, [currentHandle, currentTitle, currentImage])

  const others = items.filter((x) => x.handle !== currentHandle)
  if (others.length < 1) return null

  return (
    <section className="contenedor seccion border-t border-border">
      {/* Eyebrow genérico: va en gris. El cuero está reservado al eyebrow del
          taller, a los enlaces, a las estrellas y al hover del botón primario. */}
      <p className="eyebrow text-xs text-text-muted mb-2">{t("recent.eyebrow")}</p>
      <h3 className="display-m text-text mb-6">{t("recent.title")}</h3>
      <ul className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
        {others.map((item) => (
          <RecentItem key={item.handle} item={item} />
        ))}
      </ul>
    </section>
  )
}

/**
 * Un item del strip. Es su propio componente para poder usar el hook de
 * traducción (en inglés cambia el título por su versión EN — mismo fetch
 * cacheado que usan las tarjetas y el PDP).
 */
function RecentItem({ item }: { item: ViewedItem }) {
  const t = useT()
  const loc = useProductTranslation(item.handle)
  const title = loc?.title?.trim() || item.title
  return (
    <li>
      <Link
        href={`/products/${item.handle}`}
        className="group block"
        aria-label={`${t("card.view")} ${title}`}
      >
        {/* El plato pintado ES el marcador de posición: cuando localStorage
            devuelve una foto que aún no carga, se ve el fondo cálido y no un
            cuadro blanco, así que el SVG de silueta que había aquí sobra. */}
        <div className="plato mb-2">
          {item.image && (
            <Image src={item.image} alt={title} fill sizes="(max-width: 768px) 33vw, 16vw" />
          )}
        </div>
        <p className="nota text-text line-clamp-2 group-hover:underline underline-offset-4">
          {title}
        </p>
      </Link>
    </li>
  )
}
