"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

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
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16 border-t border-border">
      <p className="eyebrow text-leather mb-2">Visto recientemente</p>
      <h3 className="font-heading text-xl md:text-2xl text-text mb-6">
        Sigue donde te quedaste
      </h3>
      <ul className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
        {others.map((item) => (
          <li key={item.handle}>
            <Link
              href={`/products/${item.handle}`}
              className="group block"
              aria-label={`Ver ${item.title}`}
            >
              <div className="relative aspect-square overflow-hidden bg-bg-alt rounded-sm mb-2">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-text-subtle">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-muted leading-tight line-clamp-2 group-hover:text-leather transition-colors">
                {item.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
